from django.contrib import admin
from .models import Assessment, Mark, TermGrade


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'assessment_type', 'subject', 'grade', 'term', 'max_marks', 'date_conducted', 'school']
    list_filter = ['assessment_type', 'subject', 'grade', 'term', 'school']
    search_fields = ['name', 'subject__name', 'grade__name']
    date_hierarchy = 'date_conducted'


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ['student', 'assessment', 'marks_obtained', 'percentage', 'grade_letter', 'entered_by', 'entered_at']
    list_filter = ['assessment__subject', 'assessment__grade', 'assessment__term', 'school']
    search_fields = ['student__first_name', 'student__last_name', 'assessment__name']
    readonly_fields = ['percentage', 'grade_letter', 'entered_at', 'updated_at']
    date_hierarchy = 'entered_at'


@admin.register(TermGrade)
class TermGradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'term', 'grade', 'percentage', 'grade_letter', 'calculated_at']
    list_filter = ['subject', 'term', 'grade', 'school']
    search_fields = ['student__first_name', 'student__last_name', 'subject__name']
    readonly_fields = ['calculated_at']
