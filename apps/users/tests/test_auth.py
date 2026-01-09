from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.schools.models import School
# from apps.users.models import UserRole # Imported via get_user_model().UserRole equivalent if needed, but hardcoding strings is fine or importing from models
from apps.users.models import UserRole
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Test School", code="TS1")
        
        self.teacher_user = User.objects.create_user(
            username="teacher", 
            email="teacher@example.com", 
            password="password123", 
            # create_user doesn't automatically handle extra fields unless managed using a custom manager or passed as kwargs 
            # if UserManager uses **extra_fields.
            # Let's check AbstractUser manager behavior. It accepts extra_fields.
            role=UserRole.TEACHER,
            school=self.school,
            first_name="John",
            last_name="Doe"
        )

        self.hq_user = User.objects.create_user(
            username="hq",
            email="hq@example.com",
            password="password123",
            role=UserRole.ACADEMIC_MANAGER,
            first_name="Jane",
            last_name="Smith"
        )
        
        self.login_url = '/api/v1/auth/login/'
        self.me_url = '/api/v1/auth/me/'

    def test_login_success(self):
        data = {
            "email": "teacher@example.com",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify tokens are valid
        access_token = response.data['access']
        # We can decode it to check claims (requires simplejwt or jwt lib).
        # OR just use it to hit a protected endpoint
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response_me = self.client.get(self.me_url)
        self.assertEqual(response_me.status_code, status.HTTP_200_OK)
        self.assertEqual(response_me.data['email'], "teacher@example.com")
        self.assertEqual(response_me.data['school_name'], "Test School")

    def test_login_failure(self):
        data = {
            "email": "teacher@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_custom_claims(self):
        # We can inspect the token payload by decoding it
        from rest_framework_simplejwt.tokens import AccessToken
        
        data = {
            "email": "teacher@example.com",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        access_token = AccessToken(response.data['access'])
        
        self.assertEqual(access_token['role'], 'TEACHER')
        self.assertEqual(access_token['school_id'], str(self.school.id))
        self.assertEqual(access_token['name'], "John Doe")

    def test_hq_user_access(self):
        data = {
            "email": "hq@example.com",
            "password": "password123"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        access_token = AccessToken(response.data['access'])
        self.assertEqual(access_token['role'], 'ACADEMIC_MANAGER')
        self.assertIsNone(access_token['school_id'])
