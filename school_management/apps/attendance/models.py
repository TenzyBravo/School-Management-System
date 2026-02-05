from django.db import models
from apps.core.models import TenantAwareModel
import uuid


class Attendance(TenantAwareModel):
	STATUS_CHOICES = [
		('P', 'Present'),
		('A', 'Absent'),
		('L', 'Late'),
		('E', 'Excused'),
	]

	student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
	date = models.DateField()
	status = models.CharField(max_length=1, choices=STATUS_CHOICES)
	marked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
	remarks = models.TextField(blank=True, null=True)

	class Meta:
		unique_together = ('student', 'date')
		ordering = ['-date']

	def __str__(self):
		return f"Attendance: {self.student} - {self.date} - {self.get_status_display()}"

