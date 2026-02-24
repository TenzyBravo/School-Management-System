from rest_framework import generics, permissions, viewsets, status
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import TenantViewSetMixin
from .models import User, UserRole

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, ProfileSerializer, CustomTokenObtainPairSerializer
import csv
import io
import pandas as pd


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveAPIView):
    """
    Part of the auth flow. Returns details of the currently logged-in user.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Allows authenticated staff to view and update their own profile,
    including uploading a profile picture and changing their password.
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing users (teachers, staff, etc.)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role']
    search_fields = ['first_name', 'last_name', 'email']

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_upload(self, request):
        """
        Bulk upload users/faculty from CSV or Excel file

        Expected columns:
        - first_name (required)
        - last_name (required)
        - employee_number (required, unique) - Employee ID
        - email (required, unique)
        - username (required, unique)
        - password (required)
        - role (required: TEACHER, HEADTEACHER, DEPUTY_HEAD, etc.)
        - phone (optional)
        """
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.school and not request.user.is_hq_user:
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

            valid_roles = [choice[0] for choice in UserRole.choices]

            for idx, row in enumerate(rows, start=2):  # Start from 2 (row 1 is header)
                try:
                    # Required fields
                    first_name = str(row.get('first_name', '')).strip()
                    last_name = str(row.get('last_name', '')).strip()
                    employee_number = str(row.get('employee_number', '')).strip()
                    email = str(row.get('email', '')).strip().lower()
                    username = str(row.get('username', '')).strip()
                    password = str(row.get('password', '')).strip()
                    role = str(row.get('role', '')).strip().upper()

                    if not all([first_name, last_name, employee_number, email, username, password, role]):
                        errors.append({
                            'row': idx,
                            'error': 'Missing required fields (first_name, last_name, employee_number, email, username, password, role)'
                        })
                        continue

                    # Validate role
                    if role not in valid_roles:
                        errors.append({
                            'row': idx,
                            'error': f'Invalid role: {role}. Valid roles: {", ".join(valid_roles)}'
                        })
                        continue

                    # Check for duplicates
                    if User.objects.filter(employee_number=employee_number).exists():
                        skipped.append({
                            'row': idx,
                            'employee_number': employee_number,
                            'reason': 'User with this employee number already exists'
                        })
                        continue

                    if User.objects.filter(email=email).exists():
                        skipped.append({
                            'row': idx,
                            'email': email,
                            'reason': 'User with this email already exists'
                        })
                        continue

                    if User.objects.filter(username=username).exists():
                        skipped.append({
                            'row': idx,
                            'username': username,
                            'reason': 'User with this username already exists'
                        })
                        continue

                    # Create user
                    user = User.objects.create_user(
                        username=username,
                        employee_number=employee_number,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        role=role,
                        school=request.user.school,  # Assign to same school as uploader
                        phone=str(row.get('phone', '')).strip() or ''
                    )

                    created.append({
                        'row': idx,
                        'employee_number': employee_number,
                        'email': email,
                        'name': f'{first_name} {last_name}',
                        'role': role
                    })

                except Exception as e:
                    errors.append({
                        'row': idx,
                        'error': str(e)
                    })

            return Response({
                'message': f'Successfully imported {len(created)} users',
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
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users_template.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'first_name', 'last_name', 'employee_number', 'email', 'username',
            'password', 'role', 'phone'
        ])
        writer.writerow([
            'Jane', 'Smith', 'EMP001', 'jane.smith@school.com', 'jsmith',
            'SecurePass123', 'TEACHER', '+260971234567'
        ])
        writer.writerow([
            'John', 'Doe', 'EMP002', 'john.doe@school.com', 'jdoe',
            'SecurePass456', 'HEADTEACHER', '+260977654321'
        ])

        return response

