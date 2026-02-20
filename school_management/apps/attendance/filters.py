import django_filters
from .models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    date_after = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_before = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = Attendance
        fields = ['student', 'date', 'status', 'date_after', 'date_before']
