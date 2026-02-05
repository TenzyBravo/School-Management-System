from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.schools.models import School


class TokenRefreshTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.school = School.objects.create(name='Test School', code='TS1')
        self.user = User.objects.create_user(username='teacher1', email='teacher1@example.com', password='password123', role='TEACHER', school=self.school)

    def test_obtain_and_refresh_token(self):
        # Obtain tokens
        resp = self.client.post('/api/v1/auth/login/', {'email': 'teacher1@example.com', 'password': 'password123'}, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('access', data)
        self.assertIn('refresh', data)

        # Use refresh to get a new access
        refresh = data['refresh']
        resp2 = self.client.post('/api/v1/auth/refresh/', {'refresh': refresh}, content_type='application/json')
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        self.assertIn('access', data2)
