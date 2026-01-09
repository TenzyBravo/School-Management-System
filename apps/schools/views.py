from rest_framework import viewsets, permissions
from .models import School
from .serializers import SchoolSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    """Simple ViewSet for managing schools."""
    queryset = School.objects.all().order_by('name')
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]
