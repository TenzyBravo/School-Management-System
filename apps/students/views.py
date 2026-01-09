from rest_framework import viewsets, permissions
from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing students."""
    queryset = Student.objects.all().order_by('last_name', 'first_name')
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
