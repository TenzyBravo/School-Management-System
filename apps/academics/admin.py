from django.contrib import admin
from .models import AcademicYear, Term, Grade, Stream, Subject, TeacherAssignment
from .models import Classroom

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_current')

@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ('name', 'academic_year', 'start_date', 'end_date', 'is_current')
    list_filter = ('academic_year',)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'school')
    list_filter = ('school',)

@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'school')
    list_filter = ('school', 'grade')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'school', 'is_core')
    list_filter = ('school', 'is_core')

@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'grade', 'stream', 'academic_year')
    list_filter = ('grade', 'academic_year')


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'school', 'teacher', 'capacity')
    list_filter = ('school', 'grade')
