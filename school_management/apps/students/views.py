from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Student
from .serializers import StudentSerializer
from apps.core.context import get_current_school
import csv
import io
import pandas as pd
from datetime import datetime

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_class', 'gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'admission_number', 'profile__guardian_name']
    ordering_fields = ['first_name', 'last_name', 'admission_number']

    def get_queryset(self):
        # Filter by school is handled automatically if TenantAwareModel logic is perfect,
        # but ModelViewSet needs explicit filtering usually if using a standard Manager
        # unless our default manager already filters.
        # Let's check TenantManager in core/managers.py later.
        # Typically, a safe approach is:
        user = self.request.user
        print(f"VIEW DEBUG: User: {user}, School: {getattr(user, 'school', None)}")
        print(f"VIEW DEBUG: Context School: {get_current_school()}")
        if not user.school:
            if user.is_hq_user:
                return Student.objects.all()
            return Student.objects.none() # Should not happen
        qs = Student.objects.filter(school=user.school)
        print(f"VIEW DEBUG: Queryset Count: {qs.count()}")
        return qs

    def perform_create(self, serializer):
        # Automatically assign school from user
        if self.request.user.school:
           serializer.save(school=self.request.user.school)
        else:
            # If HQ user creating, they might need to specify school?
            # For now, assume HQ users can't create students without a school context.
            # Or reliance on TenantMiddleware + context.
            serializer.save()

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Bulk upload students from CSV or Excel file

        Expected columns:
        - first_name (required)
        - last_name (required)
        - admission_number (required, unique)
        - date_of_birth (YYYY-MM-DD format)
        - gender (M/F)
        - current_grade (grade ID or name)
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

        if not request.user.school:
            return Response(
                {'error': 'User must be associated with a school'},
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
                    admission_number = str(row.get('admission_number', '')).strip()

                    if not all([first_name, last_name, admission_number]):
                        errors.append({
                            'row': idx,
                            'error': 'Missing required fields (first_name, last_name, admission_number)'
                        })
                        continue

                    # Check for duplicates
                    if Student.objects.filter(
                        admission_number=admission_number,
                        school=request.user.school
                    ).exists():
                        skipped.append({
                            'row': idx,
                            'admission_number': admission_number,
                            'reason': 'Student with this admission number already exists'
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

                    # Create student
                    student = Student.objects.create(
                        school=request.user.school,
                        first_name=first_name,
                        last_name=last_name,
                        admission_number=admission_number,
                        date_of_birth=date_of_birth,
                        gender=gender if gender else None,
                        email=str(row.get('email', '')).strip() or None,
                        phone=str(row.get('phone', '')).strip() or None,
                        address=str(row.get('address', '')).strip() or None
                    )

                    created.append({
                        'row': idx,
                        'admission_number': admission_number,
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
            'first_name', 'last_name', 'admission_number', 'date_of_birth',
            'gender', 'email', 'phone', 'address'
        ])
        writer.writerow([
            'John', 'Doe', 'STU001', '2010-05-15', 'M',
            'john.doe@example.com', '+260971234567', '123 Main St'
        ])

        return response 
