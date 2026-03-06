from django.urls import path
from .views import ActiveSchoolDebugView

urlpatterns = [
    path('hq/active_school/', ActiveSchoolDebugView.as_view(), name='hq-active-school'),
]
