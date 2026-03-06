import django_filters
from .models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    date_after = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_before = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    # Support filtering by grade (student.current_class), classroom and stream
    grade = django_filters.UUIDFilter(field_name='student__current_class', lookup_expr='exact')
    stream = django_filters.UUIDFilter(field_name='student__stream', lookup_expr='exact')
    classroom = django_filters.UUIDFilter(field_name='student__classroom', lookup_expr='exact')

    class Meta:
        model = Attendance
        fields = ['student', 'date', 'status', 'date_after', 'date_before', 'grade', 'stream', 'classroom']
