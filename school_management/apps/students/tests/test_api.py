from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.users.models import User, UserRole
from apps.schools.models import School
from apps.students.models import Student

class StudentAPITest(APITestCase):
    def setUp(self):
        # Create Schools
        self.school_a = School.objects.create(name="School A", code="SCH-A")
        self.school_b = School.objects.create(name="School B", code="SCH-B")

        # Create Users
        self.teacher_a = User.objects.create_user(
            username="teacher_a",
            email="teacher_a@example.com", 
            password="password", 
            role=UserRole.TEACHER,
            school=self.school_a
        )
        self.teacher_b = User.objects.create_user(
            username="teacher_b",
            email="teacher_b@example.com", 
            password="password", 
            role=UserRole.TEACHER,
            school=self.school_b
        )
        
        # Create Students for School A
        self.student_a = Student.objects.create(
            first_name="John",
            last_name="Doe",
            admission_number="A001",
            date_of_birth="2010-01-01",
            gender="M",
            enrollment_date="2024-01-01",
            school=self.school_a
        )

        self.url = reverse('students-list')

    def test_list_students_tenant_isolation(self):
        """Test that a teacher only sees students from their own school."""
        self.client.force_authenticate(user=self.teacher_a)
        print(f"Teacher A School: {self.teacher_a.school.id}")
        print(f"Students in DB: {list(Student.objects.all_schools().values('id', 'school_id', 'admission_number'))}")
        response = self.client.get(self.url)
        print(f"Response data: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['admission_number'], "A001")

        # Teacher B should see nothing
        self.client.force_authenticate(user=self.teacher_b)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_create_student(self):
        """Test creating a student automatically assigns the correct school."""
        self.client.force_authenticate(user=self.teacher_a)
        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "admission_number": "A002",
            "date_of_birth": "2010-05-05",
            "gender": "F",
            "enrollment_date": "2024-01-01",
            "profile": {
                "guardian_name": "Parent Smith",
                "guardian_phone": "1234567890",
                "address": "123 Street"
            }
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Student.objects.all_schools().count(), 2)
        
        new_student = Student.objects.all_schools().get(admission_number="A002")
        self.assertEqual(new_student.school, self.school_a)
        self.assertEqual(new_student.profile.guardian_name, "Parent Smith")

    def test_create_student_duplicate_admission_diff_school(self):
        """Test that admission numbers are unique per school, not globally."""
        # Teacher B creates a student with same admission number A001 (which exists in School A)
        self.client.force_authenticate(user=self.teacher_b)
        data = {
            "first_name": "Bob",
            "last_name": "Builder",
            "admission_number": "A001", # Same as School A's student
            "date_of_birth": "2010-01-01",
            "gender": "M",
            "enrollment_date": "2024-01-01"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
