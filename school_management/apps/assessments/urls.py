from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, MarkViewSet, TermGradeViewSet

router = DefaultRouter()
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'marks', MarkViewSet, basename='mark')
router.register(r'term-grades', TermGradeViewSet, basename='termgrade')

urlpatterns = [
    path('', include(router.urls)),
]
