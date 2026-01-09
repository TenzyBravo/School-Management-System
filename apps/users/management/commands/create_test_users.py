from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.schools.models import School


class Command(BaseCommand):
    help = 'Create test schools and users for local development'

    def handle(self, *args, **options):
        User = get_user_model()

        # Create a sample school
        school, _ = School.objects.get_or_create(code='TS1', defaults={'name': 'Test School 1'})

        # Create teacher user
        if not User.objects.filter(email='teacher@example.com').exists():
            User.objects.create_user(
                username='teacher',
                email='teacher@example.com',
                password='password123',
                first_name='John',
                last_name='Doe',
                role=User._meta.get_field('role').default,
                school=school
            )
            self.stdout.write(self.style.SUCCESS('Created teacher@example.com / password123'))
        else:
            self.stdout.write('teacher@example.com already exists')

        # Create HQ user
        if not User.objects.filter(email='hq@example.com').exists():
            User.objects.create_user(
                username='hq',
                email='hq@example.com',
                password='password123',
                first_name='Jane',
                last_name='Smith',
                role='ACADEMIC_MANAGER'
            )
            self.stdout.write(self.style.SUCCESS('Created hq@example.com / password123'))
        else:
            self.stdout.write('hq@example.com already exists')
