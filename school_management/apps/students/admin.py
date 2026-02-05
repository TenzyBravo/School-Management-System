from django.contrib import admin
from .models import Student, StudentProfile

class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Profile'

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'current_class', 'school', 'is_active')
    list_filter = ('school', 'current_class', 'is_active', 'gender')
    search_fields = ('first_name', 'last_name', 'admission_number')
    inlines = [StudentProfileInline]
