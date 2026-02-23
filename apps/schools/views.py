from rest_framework import viewsets, permissions
from apps.core.mixins import PaginationEnforcementMixin
from .models import School
from .serializers import SchoolSerializer


class SchoolViewSet(PaginationEnforcementMixin, viewsets.ModelViewSet):
    """Simple ViewSet for managing schools."""
    queryset = School.objects.all().order_by('name')
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]
