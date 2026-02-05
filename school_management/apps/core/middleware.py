from django.utils.deprecation import MiddlewareMixin
from apps.core.context import set_current_context, clear_context

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to set current tenant in thread-local storage.
    """

    def process_request(self, request):
        user = getattr(request, 'user', None)
        
        if user and user.is_authenticated:
            # Assuming user model has 'school' attribute
            school = getattr(user, 'school', None)
            set_current_context(user, school)
        else:
            set_current_context(None, None)

    def process_response(self, request, response):
        # Clear thread-local data
        clear_context()
        return response
