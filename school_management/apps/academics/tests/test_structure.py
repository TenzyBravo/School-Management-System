from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.schools.models import School
from apps.academics.models import Grade, Stream, Subject
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class AcademicStructureTests(APITestCase):
    def setUp(self):
        # Setup Schools
        self.school1 = School.objects.create(name="School A", code="SA")
        self.school2 = School.objects.create(name="School B", code="SB")

        # Setup Users
        self.admin1 = User.objects.create_user(
            username="admin1", email="admin1@school.com", password="password",
            role='HEADTEACHER', school=self.school1
        )
        self.admin2 = User.objects.create_user(
            username="admin2", email="admin2@school.com", password="password",
            role='HEADTEACHER', school=self.school2
        )

        # Setup URLs
        self.grades_url = '/api/v1/grades/'
        self.streams_url = '/api/v1/streams/'
        self.subjects_url = '/api/v1/subjects/'

    def authenticate(self, user):
        login_url = '/api/v1/auth/login/'
        response = self.client.post(login_url, {"email": user.email, "password": "password"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_create_grade(self):
        self.authenticate(self.admin1)
        data = {"name": "Grade 1", "level": 1}
        response = self.client.post(self.grades_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Use all_schools() to check global count without context
        self.assertEqual(Grade.objects.all_schools().count(), 1)
        self.assertEqual(Grade.objects.all_schools().first().school, self.school1)

    def test_tenant_isolation_grades(self):
        # Create Grade for School 1
        g1 = Grade.objects.create(school=self.school1, name="G1", level=1)
        
        # Create Grade for School 2
        g2 = Grade.objects.create(school=self.school2, name="G2", level=2)

        # Admin 1 should only see G1
        self.authenticate(self.admin1)
        response = self.client.get(self.grades_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Depending on pagination style. If paginated:
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['id'], str(g1.id))
        else:
            self.assertEqual(len(response.data), 1)

        # Admin 2 should only see G2
        self.authenticate(self.admin2)
        response = self.client.get(self.grades_url)
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertEqual(response.data['results'][0]['id'], str(g2.id))
        else:
            self.assertEqual(len(response.data), 1)

    def test_stream_creation_nested(self):
        self.authenticate(self.admin1)
        grade = Grade.objects.create(school=self.school1, name="G1", level=1)
        
        data = {
            "grade": grade.id,
            "name": "Blue"
        }
        response = self.client.post(self.streams_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Stream.objects.all_schools().count(), 1)
        self.assertEqual(Stream.objects.all_schools().first().grade, grade)

    def test_subject_uniqueness(self):
        self.authenticate(self.admin1)
        Subject.objects.create(school=self.school1, name="Math", code="MAT")
        
        data = {"name": "Mathematics", "code": "MAT", "is_core": True}
        response = self.client.post(self.subjects_url, data)
        # Should fail due to uniqueness constraint on (school, code)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
