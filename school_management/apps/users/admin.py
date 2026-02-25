from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserRole


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'employee_number', 'role', 'school', 'is_active')
    list_filter = ('role', 'school', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'employee_number')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        ('Staff details', {'fields': ('role', 'employee_number', 'school')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'first_name', 'last_name',
                'employee_number', 'role', 'school', 'phone',
                'password1', 'password2',
            ),
        }),
    )
