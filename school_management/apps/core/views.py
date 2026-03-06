from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.apps import apps
from apps.core.context import get_current_school, get_current_user


class ActiveSchoolDebugView(APIView):
    """
    Debug endpoint (HQ only) that returns the current thread-local school and
    user as seen by middleware/tenant manager. This helps confirm whether the
    X-Active-School header is being honored.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = get_current_user() or request.user
        school = get_current_school()

        # Only allow superusers or HQ users to query this endpoint
        is_hq = getattr(user, 'is_superuser', False) or getattr(user, 'is_hq_user', False)
        if not is_hq:
            return Response({'detail': 'forbidden'}, status=403)

        school_data = None
        if school:
            school_data = {
                'id': str(school.pk),
                'name': getattr(school, 'name', None),
            }

        user_data = {
            'id': str(getattr(user, 'pk', None)),
            'email': getattr(user, 'email', None),
            'is_superuser': getattr(user, 'is_superuser', False),
            'is_hq_user': getattr(user, 'is_hq_user', False),
        }

        return Response({'active_school': school_data, 'user': user_data})
