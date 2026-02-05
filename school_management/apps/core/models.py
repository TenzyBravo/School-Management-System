from django.db import models
import uuid
from apps.core.context import get_current_school
from apps.core.managers import TenantManager

class TenantAwareModel(models.Model):
    """
    Abstract base model that provides tenant isolation.
    All tenant-scoped models should inherit from this.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        'schools.School',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Ensure school is set from request context if not provided
        if not self.school_id:
            school = get_current_school()
            if school:
                self.school = school
            # Else: It might fail validation if school is required, which is intended.
        super().save(*args, **kwargs)
