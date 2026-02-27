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

            from apps.schools.models import School as SchoolModel
            from apps.academics.models import Grade, Stream
            from .models import StudentProfile
            from datetime import date as _date

            # ── Pre-scan: intra-file duplicate child_ids ──────────────────
            child_id_counts = {}
            for r in rows:
                cid = str(r.get('child_id', '')).strip()
                if cid:
                    child_id_counts[cid] = child_id_counts.get(cid, 0) + 1
            intra_file_duplicates = {cid for cid, n in child_id_counts.items() if n > 1}
            seen_in_file = set()

            # ── Pre-fetch lookups (6 queries total, not N*5) ──────────────
            # 1. Schools by code (for rows with school_code column)
            school_codes_in_file = {
                str(r.get('school_code', '')).strip()
                for r in rows
                if str(r.get('school_code', '')).strip() not in ('', 'nan')
            }
            schools_by_code = {}
            if school_codes_in_file and is_hq:
                for s in SchoolModel.objects.filter(code__in=school_codes_in_file, is_active=True):
                    schools_by_code[s.code] = s

            # 2. All relevant schools
            relevant_schools = set()
            if school:
                relevant_schools.add(school)
            relevant_schools.update(schools_by_code.values())

            # 3. Grades: (school_id, name_lower) → Grade
            grades_map = {}
            for g in Grade.objects.filter(school__in=relevant_schools):
                grades_map[(g.school_id, g.name.lower())] = g

            # 4. Streams: (grade_id, name_lower) → Stream
            streams_map = {}
            if grades_map:
                for s in Stream.objects.filter(grade__in=grades_map.values()):
                    streams_map[(s.grade_id, s.name.lower())] = s

            # 5. Existing child_ids: set of (child_id, school_id) for O(1) lookup
            existing_child_ids = set()
            if relevant_schools:
                existing_child_ids = set(
                    Student.objects.filter(school__in=relevant_schools)
                    .values_list('child_id', 'school_id')
                )

            # ── Validate & collect rows ───────────────────────────────────
            created = []
            errors = []
            skipped = []
            students_to_create = []
            profiles_to_create = []  # list of (student_index, profile_kwargs)

            for idx, row in enumerate(rows, start=2):
                first_name = str(row.get('first_name', '')).strip()
                last_name  = str(row.get('last_name',  '')).strip()
                child_id   = str(row.get('child_id',   '')).strip()

                if not all([first_name, last_name, child_id]):
                    errors.append({'row': idx, 'error': 'Missing required fields (first_name, last_name, child_id)'})
                    continue

                # Intra-file duplicate
                if child_id in intra_file_duplicates and child_id in seen_in_file:
                    skipped.append({'row': idx, 'child_id': child_id,
                                    'reason': f'Duplicate in file — "{child_id}" appears more than once (only first row used)'})
                    continue
                seen_in_file.add(child_id)

                # Resolve school
                row_school = school
                school_code_str = str(row.get('school_code', '')).strip()
                if school_code_str and school_code_str != 'nan' and is_hq:
                    row_school = schools_by_code.get(school_code_str)
                    if not row_school:
                        errors.append({'row': idx, 'error': f'School with code "{school_code_str}" not found'})
                        continue

                if not row_school:
                    errors.append({'row': idx, 'error': 'No school context. Add a school_code column or select a school first.'})
                    continue

                # Database duplicate (O(1) set lookup — no extra query)
                if (child_id, row_school.id) in existing_child_ids:
                    skipped.append({'row': idx, 'child_id': child_id,
                                    'reason': f'Already exists in {row_school.name} — "{child_id}" is already enrolled'})
                    continue

                # date_of_birth
                date_of_birth = None
                dob_str = str(row.get('date_of_birth', '')).strip()
                if dob_str and dob_str != 'nan':
                    try:
                        date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                    except ValueError:
                        errors.append({'row': idx, 'error': f'Invalid date_of_birth "{dob_str}". Use YYYY-MM-DD'})
                        continue
                if date_of_birth is None:
                    errors.append({'row': idx, 'error': 'date_of_birth is required'})
                    continue

                # gender
                gender = str(row.get('gender', '')).strip().upper() or 'M'
                if gender not in ['M', 'F']:
                    errors.append({'row': idx, 'error': f'Invalid gender "{gender}". Use M or F'})
                    continue

                # enrollment_date
                enroll_str = str(row.get('enrollment_date', '')).strip()
                try:
                    enrollment_date = datetime.strptime(enroll_str, '%Y-%m-%d').date() if enroll_str and enroll_str != 'nan' else _date.today()
                except ValueError:
                    enrollment_date = _date.today()

                # Resolve grade (O(1) map lookup)
                current_class = None
                grade_name_str = str(row.get('grade_name', '')).strip()
                if grade_name_str and grade_name_str != 'nan':
                    current_class = grades_map.get((row_school.id, grade_name_str.lower()))
                    if not current_class:
                        errors.append({'row': idx, 'error': f'Grade "{grade_name_str}" not found in {row_school.name}'})
                        continue

                # Resolve stream (O(1) map lookup)
                current_stream = None
                stream_name_str = str(row.get('stream_name', '')).strip()
                if stream_name_str and stream_name_str != 'nan':
                    if not current_class:
                        errors.append({'row': idx, 'error': f'stream_name "{stream_name_str}" given but grade_name is missing'})
                        continue
                    current_stream = streams_map.get((current_class.id, stream_name_str.lower()))
                    if not current_stream:
                        errors.append({'row': idx, 'error': f'Stream "{stream_name_str}" not found in grade "{grade_name_str}"'})
                        continue

                # Queue for bulk insert
                students_to_create.append(Student(
                    school=row_school,
                    first_name=first_name,
                    last_name=last_name,
                    child_id=child_id,
                    admission_number=str(row.get('admission_number', '')).strip() or None,
                    date_of_birth=date_of_birth,
                    gender=gender,
                    enrollment_date=enrollment_date,
                    current_class=current_class,
                    current_stream=current_stream,
                ))
                guardian_name  = str(row.get('guardian_name',  '')).strip()
                guardian_phone = str(row.get('guardian_phone', '')).strip()
                if guardian_name and guardian_phone:
                    profiles_to_create.append({
                        'idx': len(students_to_create) - 1,
                        'guardian_name':  guardian_name,
                        'guardian_phone': guardian_phone,
                        'guardian_email': str(row.get('guardian_email', '')).strip() or None,
                        'address':        str(row.get('address', '')).strip() or '',
                    })

                created.append({'row': idx, 'child_id': child_id, 'name': f'{first_name} {last_name}'})
                # Add to set so later rows in this file don't create a DB duplicate
                existing_child_ids.add((child_id, row_school.id))

            # ── Bulk insert (2 queries) ───────────────────────────────────
            if students_to_create:
                inserted = Student.objects.bulk_create(students_to_create)
                if profiles_to_create:
                    StudentProfile.objects.bulk_create([
                        StudentProfile(
                            student=inserted[p['idx']],
                            guardian_name=p['guardian_name'],
                            guardian_phone=p['guardian_phone'],
                            guardian_email=p['guardian_email'],
                            address=p['address'],
                        )
                        for p in profiles_to_create
                    ])

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

