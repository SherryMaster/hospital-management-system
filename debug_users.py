#!/usr/bin/env python
"""
Debug script to check user roles in the database
Run this in Django shell: python manage.py shell < debug_users.py
"""

from django.contrib.auth import get_user_model
User = get_user_model()

print("=== USER ROLES DEBUG ===")
print(f"Available roles: {[choice[0] for choice in User.UserRole.choices]}")
print()

print("=== ALL USERS ===")
users = User.objects.all()
for user in users:
    print(f"ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: '{user.role}'")
    print(f"Is Admin: {user.is_admin}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Active: {user.is_active}")
    print("---")

print("\n=== ADMIN USERS ===")
admin_users = User.objects.filter(role='admin')
print(f"Found {admin_users.count()} admin users:")
for user in admin_users:
    print(f"- {user.username} ({user.email}) - Role: '{user.role}'")

print("\n=== SUPERUSERS ===")
superusers = User.objects.filter(is_superuser=True)
print(f"Found {superusers.count()} superusers:")
for user in superusers:
    print(f"- {user.username} ({user.email}) - Role: '{user.role}'")

print("\n=== USERS WITH INVALID ROLES ===")
valid_roles = [choice[0] for choice in User.UserRole.choices]
invalid_users = User.objects.exclude(role__in=valid_roles)
print(f"Found {invalid_users.count()} users with invalid roles:")
for user in invalid_users:
    print(f"- {user.username} ({user.email}) - Role: '{user.role}' (INVALID)")
