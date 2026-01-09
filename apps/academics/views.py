from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import IsHQUser, IsSchoolAdmin
from apps.core.mixins import TenantViewSetMixin
from .models import AcademicYear, Term, Grade, Stream, Subject, TeacherAssignment
from .serializers import (
    AcademicYearSerializer, TermSerializer, GradeSerializer, 
    StreamSerializer, SubjectSerializer, TeacherAssignmentSerializer
)

class AcademicYearViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by('-start_date')
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated] # Read-only for most, write for HQ?
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHQUser()]
        return super().get_permissions()

class TermViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Term.objects.all().order_by('start_date')
    serializer_class = TermSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['academic_year', 'is_current']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHQUser()]
        return super().get_permissions()

class GradeViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsSchoolAdmin] # Only school admins can manage grades? Or HQ too.
    # TenantManager automatically filters queryset
    
    def get_permissions(self):
         if self.action in ['list', 'retrieve']:
             return [permissions.IsAuthenticated()]
         return [IsSchoolAdmin()]

class StreamViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer
    permission_classes = [IsSchoolAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade']

    def get_permissions(self):
         if self.action in ['list', 'retrieve']:
             return [permissions.IsAuthenticated()]
         return [IsSchoolAdmin()]

class SubjectViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsSchoolAdmin]

    def get_permissions(self):
         if self.action in ['list', 'retrieve']:
             return [permissions.IsAuthenticated()]
         return [IsSchoolAdmin()]

class TeacherAssignmentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsSchoolAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'grade', 'stream', 'subject', 'academic_year']

    def get_permissions(self):
         if self.action in ['list', 'retrieve']:
             return [permissions.IsAuthenticated()]
         return [IsSchoolAdmin()]
