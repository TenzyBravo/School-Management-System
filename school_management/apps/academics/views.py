from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
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
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [IsSchoolAdmin]

    def get_permissions(self):
        # Any authenticated user with a school can manage their school's grades
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    def perform_update(self, serializer):
        serializer.save(school=self.request.user.school)

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Return all active students enrolled in this grade."""
        from apps.students.models import Student
        from apps.students.serializers import StudentSerializer
        grade = self.get_object()
        qs = Student.objects.filter(school=request.user.school, current_class=grade, is_active=True)
        serializer = StudentSerializer(qs.order_by('last_name', 'first_name'), many=True)
        return Response(serializer.data)


class StreamViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade']

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    def perform_update(self, serializer):
        serializer.save(school=self.request.user.school)


class SubjectViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    def perform_update(self, serializer):
        serializer.save(school=self.request.user.school)


class TeacherAssignmentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsSchoolAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'grade', 'stream', 'subject', 'academic_year']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_classes']:
            return [permissions.IsAuthenticated()]
        return [IsSchoolAdmin()]

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    @action(detail=False, methods=['get'], url_path='my-classes')
    def my_classes(self, request):
        """
        Returns the current teacher's assignments for the active academic year.
        """
        current_year = AcademicYear.objects.filter(is_current=True).first()
        if not current_year:
            current_year = AcademicYear.objects.order_by('-start_date').first()

        qs = TeacherAssignment.objects.filter(
            teacher=request.user,
            school=request.user.school,
        )
        if current_year:
            qs = qs.filter(academic_year=current_year)

        qs = qs.select_related('grade', 'stream', 'subject', 'academic_year')
        serializer = TeacherAssignmentSerializer(qs, many=True, context={'request': request})
        return Response({
            'academic_year': current_year.name if current_year else None,
            'assignments': serializer.data,
        })
