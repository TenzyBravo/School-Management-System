from rest_framework_simplejwt.authentication import JWTAuthentication
from apps.core.context import set_current_context

class TenantJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that sets the tenant context
    upon successful authentication.
    """
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, token = result
            # Set the thread-local context
            # Assuming user model has property 'school'
            school = getattr(user, 'school', None)
            set_current_context(user, school)
        return result
