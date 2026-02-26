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

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Bulk upload students from CSV or Excel file

        Expected columns:
        - first_name (required)
        - last_name (required)
        - child_id (required, unique) - Child ID/CHL
        - date_of_birth (YYYY-MM-DD format)
        - gender (M/F)
        - admission_number (optional, for legacy data)
        - email (optional)
        - phone (optional)
        - address (optional)
        """
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        school = get_current_school() or getattr(request.user, 'school', None)
        if not school:
            return Response(
                {'error': 'No active school context. Select a school first.'},
                status=status.HTTP_403_FORBIDDEN
            )

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

                    # Check for duplicates
                    if Student.objects.filter(
                        child_id=child_id,
                        school=school
                    ).exists():
                        skipped.append({
                            'row': idx,
                            'child_id': child_id,
                            'reason': 'Student with this Child ID already exists'
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

                    # Create student
                    student = Student.objects.create(
                        school=school,
                        first_name=first_name,
                        last_name=last_name,
                        child_id=child_id,
                        admission_number=str(row.get('admission_number', '')).strip() or None,
                        date_of_birth=date_of_birth,
                        gender=gender if gender else 'M',
                        enrollment_date=enrollment_date,
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

            return Response({
                'message': f'Successfully imported {len(created)} students',
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

    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """Download CSV template for bulk upload"""
        response = Response(
            content_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename="students_template.csv"'}
        )

        writer = csv.writer(response)
        writer.writerow([
            'first_name', 'last_name', 'child_id', 'date_of_birth',
            'gender', 'enrollment_date', 'admission_number',
            'guardian_name', 'guardian_phone', 'guardian_email', 'address'
        ])
        writer.writerow([
            'John', 'Doe', 'CHL001', '2010-05-15', 'M',
            '2024-01-15', 'STU001',
            'Jane Doe', '+260971234567', 'jane@example.com', '123 Main St'
        ])

        return response 
