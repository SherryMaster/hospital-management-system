#!/usr/bin/env python
"""
Cleanup script to remove soft-deleted departments
Run this in Django shell: python manage.py shell < cleanup_departments.py
"""

from apps.doctors.models import Department

print("=== DEPARTMENT CLEANUP ===")

# Find all departments (including inactive ones)
all_departments = Department.objects.all()
print(f"Total departments in database: {all_departments.count()}")

# Find inactive departments
inactive_departments = Department.objects.filter(is_active=False)
print(f"Inactive departments: {inactive_departments.count()}")

if inactive_departments.exists():
    print("\nInactive departments found:")
    for dept in inactive_departments:
        print(f"- {dept.name} (ID: {dept.id}, Active: {dept.is_active})")
    
    print("\nRemoving inactive departments...")
    deleted_count = inactive_departments.count()
    inactive_departments.delete()
    print(f"Deleted {deleted_count} inactive departments")
else:
    print("No inactive departments found")

# Show remaining active departments
active_departments = Department.objects.filter(is_active=True)
print(f"\nRemaining active departments: {active_departments.count()}")
for dept in active_departments:
    print(f"- {dept.name} (ID: {dept.id})")

print("\nCleanup complete!")
