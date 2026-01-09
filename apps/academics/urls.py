from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, TermViewSet, GradeViewSet, 
    StreamViewSet, SubjectViewSet, TeacherAssignmentViewSet
)

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet)
router.register(r'terms', TermViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'streams', StreamViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'assignments', TeacherAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
