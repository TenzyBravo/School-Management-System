from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Student
from .serializers import StudentSerializer
from apps.core.context import get_current_school
from apps.core.mixins import TenantViewSetMixin
import csv
import io
import pandas as pd
from datetime import datetime

class StudentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_class', 'gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'admission_number', 'profile__guardian_name']
    ordering_fields = ['first_name', 'last_name', 'admission_number']

    def get_queryset(self):
        user = self.request.user
        school = get_current_school() or getattr(user, 'school', None)
        if not school:
            if getattr(user, 'is_hq_user', False):
                return Student.objects.all()
            return Student.objects.none()
        return Student.objects.filter(school=school)

    def perform_create(self, serializer):
        school = get_current_school() or getattr(self.request.user, 'school', None)
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Your account is not linked to a school.")
        serializer.save(school=school)

    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """Return a CSV template with the correct column headers for bulk student upload."""
        from django.http import HttpResponse
        headers = [
            'first_name', 'last_name', 'child_id', 'date_of_birth', 'gender',
            'enrollment_date', 'admission_number',
            'school_code', 'grade_name', 'stream_name',
            'guardian_name', 'guardian_phone', 'guardian_email', 'address',
        ]
        sample = [
            'Jane', 'Banda', 'CHL-0001', '2015-03-21', 'F',
            '2024-01-15', 'ADM-001',
            'BLA', 'Grade 1', 'Cheetah',
            'Mary Banda', '0977123456', 'mary@example.com', '12 Kaunda Rd, Lusaka',
        ]
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="students_template.csv"'
        writer = csv.writer(response)
        writer.writerow(headers)
        writer.writerow(sample)
        return response

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Bulk upload students from CSV or Excel file

        Expected columns:
        - first_name (required)
        - last_name (required)
        - child_id (required, unique)
        - date_of_birth (YYYY-MM-DD, optional)
        - gender (M/F, optional)
        - enrollment_date (YYYY-MM-DD, optional — defaults to today)
        - admission_number (optional)
        - guardian_name, guardian_phone, guardian_email, address (optional)
        - address (optional)
        """
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        school = get_current_school() or getattr(request.user, 'school', None)
        is_hq = getattr(request.user, 'is_hq_user', False) or getattr(request.user, 'is_superuser', False)
        if not school and not is_hq:
            return Response(
                {'error': 'No active school context. Select a school first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # HQ/SUPER_ADMIN with no context: school is None, each row must supply school_code

        # Determine file type and parse accordingly
        file_name = file_obj.name.lower()

        try:
            if file_name.endswith('.csv'):
                # Parse CSV
                decoded_file = file_obj.read().decode('utf-8')
                io_string = io.StringIO(decoded_file)
                reader = csv.DictReader(io_string)
                rows = list(reader)
            elif file_name.endswith(('.xlsx', '.xls')):
                # Parse Excel
                df = pd.read_excel(file_obj)
                rows = df.to_dict('records')
            else:
                return Response(
                    {'error': 'Unsupported file format. Please upload CSV or Excel file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Pre-scan: find child_ids that appear more than once in this file
            child_id_counts = {}
            for r in rows:
                cid = str(r.get('child_id', '')).strip()
                if cid:
                    child_id_counts[cid] = child_id_counts.get(cid, 0) + 1
            intra_file_duplicates = {cid for cid, count in child_id_counts.items() if count > 1}
            seen_in_file = set()  # track first occurrence of each child_id in this upload

            # Process rows
            created = []
            errors = []
            skipped = []

            for idx, row in enumerate(rows, start=2):  # Start from 2 (row 1 is header)
                try:
                    # Required fields
                    first_name = str(row.get('first_name', '')).strip()
                    last_name = str(row.get('last_name', '')).strip()
                    child_id = str(row.get('child_id', '')).strip()

                    if not all([first_name, last_name, child_id]):
                        errors.append({
                            'row': idx,
                            'error': 'Missing required fields (first_name, last_name, child_id)'
                        })
                        continue

                    # Flag duplicate child_ids within this file
                    if child_id in intra_file_duplicates:
                        if child_id in seen_in_file:
                            skipped.append({
                                'row': idx,
                                'child_id': child_id,
                                'reason': f'Duplicate in file — child_id "{child_id}" appears more than once (only first row uploaded)'
                            })
                            continue
                    seen_in_file.add(child_id)

                    # Per-row school resolution (HQ users can specify school_code per row)
                    row_school = school
                    school_code_str = str(row.get('school_code', '')).strip()
                    if school_code_str and school_code_str != 'nan':
                        if is_hq:
                            from apps.schools.models import School as SchoolModel
                            try:
                                row_school = SchoolModel.objects.get(code=school_code_str, is_active=True)
                            except SchoolModel.DoesNotExist:
                                errors.append({
                                    'row': idx,
                                    'error': f'School with code "{school_code_str}" not found'
                                })
                                continue

                    # If still no school resolved, require school_code for HQ users
                    if not row_school:
                        errors.append({
                            'row': idx,
                            'error': 'No school context for this row. Add a school_code column or select a school first.'
                        })
                        continue

                    # Check for duplicates against existing database records
                    if Student.objects.filter(
                        child_id=child_id,
                        school=row_school
                    ).exists():
                        skipped.append({
                            'row': idx,
                            'child_id': child_id,
                            'reason': f'Already exists in {row_school.name} — child_id "{child_id}" is already enrolled'
                        })
                        continue

                    # Optional fields
                    date_of_birth = None
                    dob_str = str(row.get('date_of_birth', '')).strip()
                    if dob_str and dob_str != 'nan':
                        try:
                            date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                        except ValueError:
                            errors.append({
                                'row': idx,
                                'error': f'Invalid date format for date_of_birth: {dob_str}. Use YYYY-MM-DD'
                            })
                            continue

                    gender = str(row.get('gender', '')).strip().upper()
                    if gender and gender not in ['M', 'F']:
                        errors.append({
                            'row': idx,
                            'error': f'Invalid gender: {gender}. Use M or F'
                        })
                        continue

                    # enrollment_date: use column or today
                    enroll_str = str(row.get('enrollment_date', '')).strip()
                    if enroll_str and enroll_str != 'nan':
                        try:
                            enrollment_date = datetime.strptime(enroll_str, '%Y-%m-%d').date()
                        except ValueError:
                            from datetime import date as _date
                            enrollment_date = _date.today()
                    else:
                        from datetime import date as _date
                        enrollment_date = _date.today()

                    # Resolve grade (current_class)
                    current_class = None
                    grade_name_str = str(row.get('grade_name', '')).strip()
                    if grade_name_str and grade_name_str != 'nan':
                        from apps.academics.models import Grade, Stream
                        try:
                            current_class = Grade.objects.get(school=row_school, name__iexact=grade_name_str)
                        except Grade.DoesNotExist:
                            errors.append({
                                'row': idx,
                                'error': f'Grade "{grade_name_str}" not found in school "{row_school.name}"'
                            })
                            continue

                    # Resolve stream (current_stream)
                    current_stream = None
                    stream_name_str = str(row.get('stream_name', '')).strip()
                    if stream_name_str and stream_name_str != 'nan':
                        if current_class is None:
                            errors.append({
                                'row': idx,
                                'error': f'stream_name "{stream_name_str}" given but grade_name is missing'
                            })
                            continue
                        from apps.academics.models import Stream
                        try:
                            current_stream = Stream.objects.get(grade=current_class, name__iexact=stream_name_str)
                        except Stream.DoesNotExist:
                            errors.append({
                                'row': idx,
                                'error': f'Stream "{stream_name_str}" not found in grade "{grade_name_str}"'
                            })
                            continue

                    # Create student
                    student = Student.objects.create(
                        school=row_school,
                        first_name=first_name,
                        last_name=last_name,
                        child_id=child_id,
                        admission_number=str(row.get('admission_number', '')).strip() or None,
                        date_of_birth=date_of_birth,
                        gender=gender if gender else 'M',
                        enrollment_date=enrollment_date,
                        current_class=current_class,
                        current_stream=current_stream,
                    )

                    # Create guardian profile if provided
                    guardian_name = str(row.get('guardian_name', '')).strip()
                    guardian_phone = str(row.get('guardian_phone', '')).strip()
                    if guardian_name and guardian_phone:
                        from .models import StudentProfile
                        StudentProfile.objects.create(
                            student=student,
                            guardian_name=guardian_name,
                            guardian_phone=guardian_phone,
                            guardian_email=str(row.get('guardian_email', '')).strip() or None,
                            address=str(row.get('address', '')).strip() or '',
                        )

                    created.append({
                        'row': idx,
                        'child_id': child_id,
                        'name': f'{first_name} {last_name}'
                    })

                except Exception as e:
                    errors.append({
                        'row': idx,
                        'error': str(e)
                    })

            file_duplicates = [s for s in skipped if 'Duplicate in file' in s.get('reason', '')]
            db_duplicates = [s for s in skipped if 'Already exists' in s.get('reason', '')]
            summary = f'Imported {len(created)} students'
            if file_duplicates:
                summary += f', {len(file_duplicates)} duplicate(s) in file skipped'
            if db_duplicates:
                summary += f', {len(db_duplicates)} already enrolled skipped'
            if errors:
                summary += f', {len(errors)} error(s)'

            return Response({
                'message': summary,
                'created': len(created),
                'errors': len(errors),
                'skipped': len(skipped),
                'details': {
                    'created': created,
                    'errors': errors,
                    'skipped': skipped
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to process file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

