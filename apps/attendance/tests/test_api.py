from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.schools.models import School
from apps.academics.models import Grade, Stream, Classroom
from apps.students.models import Student
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class AttendanceAPITests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="FLMZ Academy", code="FLMZ")
        self.admin = User.objects.create_user(
            username="admin", email="admin@flmz.local", password="password",
            role='HEADTEACHER', school=self.school
        )

        # Academic structure
        self.grade = Grade.objects.create(school=self.school, name="G1", level=1)
        self.classroom = Classroom.objects.create(school=self.school, grade=self.grade, name="G1-A")
        self.stream = Stream.objects.create(school=self.school, grade=self.grade, name="Blue")

        # Students
        self.s1 = Student.objects.create(school=self.school, first_name='Amy', last_name='One', admission_number='A1', date_of_birth='2012-01-01', gender='F', enrollment_date='2020-01-01', classroom=self.classroom, stream=self.stream)
        self.s2 = Student.objects.create(school=self.school, first_name='Ben', last_name='Two', admission_number='B2', date_of_birth='2012-02-02', gender='M', enrollment_date='2020-01-01', classroom=self.classroom, stream=self.stream)

        self.bulk_url = '/api/v1/attendance/bulk_create/'
        self.attendance_url = '/api/v1/attendance/'

    def authenticate(self, user):
        login_url = '/api/v1/auth/login/'
        response = self.client.post(login_url, {"email": user.email, "password": "password"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_bulk_create_by_classroom_creates_records(self):
        self.authenticate(self.admin)
        data = {"classroom": str(self.classroom.id), "date": "2024-10-10", "status": "P"}
        response = self.client.post(self.bulk_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 2)

    def test_filter_by_classroom_returns_records(self):
        # create attendance records
        from apps.attendance.models import Attendance
        Attendance.objects.create(school=self.school, student=self.s1, date='2024-10-11', status='P')
        Attendance.objects.create(school=self.school, student=self.s2, date='2024-10-11', status='A')

        self.authenticate(self.admin)
        response = self.client.get(self.attendance_url, {'classroom': str(self.classroom.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return 2 records
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 2)
        else:
            self.assertEqual(len(response.data), 2)
