from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from apps.schools.models import School
from apps.core.models import TenantAwareModel
from apps.core.middleware import TenantMiddleware
from apps.core.context import get_current_school

User = get_user_model()

# Create a dummy tenant model for testing
from django.db import models
class Report(TenantAwareModel):
    title = models.CharField(max_length=100)
    class Meta:
        # This is strictly for testing, won't be in DB unless we migrate. 
        # But we can't migrate a dynamic model easily in Django tests without hacks.
        # So we will use an existing model if possible, or Mocking.
        # Actually, let's use Student model if initialized? No, Student is in phase 4.
        # We can use School model? No, School is not TenantAware.
        abstract = True

# Better approach: We need a concrete model to test TenantAwareModel.
# Since we haven't implemented Student yet (it's Phase 4), we can't use it.
# We will create a test that verifies the Middleware and Context.
# And verify Manager logic by mocking.

class TenantMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.school1 = School.objects.create(name="School 1", code="S1")
        self.school2 = School.objects.create(name="School 2", code="S2")
        
        self.user1 = User.objects.create_user(username="u1", email="u1@example.com", password="pw", school=self.school1)
        self.user2 = User.objects.create_user(username="u2", email="u2@example.com", password="pw", school=self.school2)
        self.hq_user = User.objects.create_user(username="hq", email="hq@example.com", password="pw", role="ACADEMIC_MANAGER")

    def test_middleware_process_request(self):
        middleware = TenantMiddleware(get_response=lambda r: None)
        
        # Test User 1 (School 1)
        request = self.factory.get('/')
        request.user = self.user1
        middleware.process_request(request)
        self.assertEqual(get_current_school(), self.school1)
        
        # Test User 2 (School 2)
        request = self.factory.get('/')
        request.user = self.user2
        middleware.process_request(request)
        self.assertEqual(get_current_school(), self.school2)
        
        # Test HQ User (No School)
        request = self.factory.get('/')
        request.user = self.hq_user
        middleware.process_request(request)
        self.assertIsNone(get_current_school())

    def test_context_clearing(self):
        middleware = TenantMiddleware(get_response=lambda r: None)
        request = self.factory.get('/')
        request.user = self.user1
        
        middleware.process_request(request)
        self.assertIsNotNone(get_current_school())
        
        middleware.process_response(request, None)
        self.assertIsNone(get_current_school())
