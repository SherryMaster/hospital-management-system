"""
Hospital Management System - Database Health Check Command

Django management command to check database health and connectivity.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, connections
from django.conf import settings
import time
import sys


class Command(BaseCommand):
    help = 'Check database health and connectivity'

    def add_arguments(self, parser):
        parser.add_argument(
            '--database',
            default='default',
            help='Database alias to check (default: default)',
        )
        parser.add_argument(
            '--timeout',
            type=int,
            default=30,
            help='Connection timeout in seconds (default: 30)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information',
        )

    def handle(self, *args, **options):
        database = options['database']
        timeout = options['timeout']
        verbose = options['verbose']

        self.stdout.write(
            self.style.HTTP_INFO('🏥 Hospital Management System - Database Health Check')
        )
        self.stdout.write('=' * 60)

        try:
            # Get database connection
            db_conn = connections[database]
            
            if verbose:
                self.show_database_info(db_conn)

            # Test basic connectivity
            self.test_connection(db_conn, timeout)
            
            # Test query execution
            self.test_query_execution(db_conn)
            
            # Check migrations
            self.check_migrations()
            
            # Show connection pool info
            if verbose:
                self.show_connection_info(db_conn)

            self.stdout.write(
                self.style.SUCCESS('\n✅ Database health check completed successfully!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Database health check failed: {str(e)}')
            )
            raise CommandError(f'Database health check failed: {str(e)}')

    def show_database_info(self, db_conn):
        """Show database configuration information."""
        self.stdout.write('\n📊 Database Configuration:')
        self.stdout.write('-' * 30)
        
        db_settings = db_conn.settings_dict
        
        # Safely display connection info (hide password)
        engine = db_settings.get('ENGINE', 'Unknown')
        name = db_settings.get('NAME', 'Unknown')
        host = db_settings.get('HOST', 'localhost')
        port = db_settings.get('PORT', 'default')
        user = db_settings.get('USER', 'Unknown')
        
        self.stdout.write(f'Engine: {engine}')
        self.stdout.write(f'Database: {name}')
        self.stdout.write(f'Host: {host}')
        self.stdout.write(f'Port: {port}')
        self.stdout.write(f'User: {user}')

    def test_connection(self, db_conn, timeout):
        """Test database connection."""
        self.stdout.write('\n🔌 Testing Database Connection:')
        self.stdout.write('-' * 35)
        
        start_time = time.time()
        
        try:
            # Ensure connection
            db_conn.ensure_connection()
            
            connection_time = time.time() - start_time
            self.stdout.write(
                self.style.SUCCESS(f'✅ Connection successful ({connection_time:.3f}s)')
            )
            
            if connection_time > 5:
                self.stdout.write(
                    self.style.WARNING('⚠️  Connection time is high (>5s)')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Connection failed: {str(e)}')
            )
            raise

    def test_query_execution(self, db_conn):
        """Test basic query execution."""
        self.stdout.write('\n🔍 Testing Query Execution:')
        self.stdout.write('-' * 30)
        
        try:
            with db_conn.cursor() as cursor:
                # Test simple query
                start_time = time.time()
                cursor.execute("SELECT 1 as test")
                result = cursor.fetchone()
                query_time = time.time() - start_time
                
                if result and result[0] == 1:
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Query execution successful ({query_time:.3f}s)')
                    )
                else:
                    raise Exception('Unexpected query result')
                    
                # Test database-specific queries
                self.test_database_specific_queries(cursor)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Query execution failed: {str(e)}')
            )
            raise

    def test_database_specific_queries(self, cursor):
        """Test database-specific functionality."""
        try:
            # PostgreSQL specific
            if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                cursor.execute("SELECT version()")
                version = cursor.fetchone()[0]
                self.stdout.write(f'PostgreSQL Version: {version.split(",")[0]}')
                
            # SQLite specific
            elif 'sqlite' in settings.DATABASES['default']['ENGINE']:
                cursor.execute("SELECT sqlite_version()")
                version = cursor.fetchone()[0]
                self.stdout.write(f'SQLite Version: {version}')
                
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Database-specific query failed: {str(e)}')
            )

    def check_migrations(self):
        """Check migration status."""
        self.stdout.write('\n📋 Checking Migrations:')
        self.stdout.write('-' * 25)
        
        try:
            from django.core.management import call_command
            from io import StringIO
            
            # Capture showmigrations output
            out = StringIO()
            call_command('showmigrations', '--plan', stdout=out)
            migrations_output = out.getvalue()
            
            # Count applied and unapplied migrations
            lines = migrations_output.strip().split('\n')
            applied = sum(1 for line in lines if '[X]' in line)
            unapplied = sum(1 for line in lines if '[ ]' in line)
            
            if unapplied == 0:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ All migrations applied ({applied} total)')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {unapplied} unapplied migrations found')
                )
                self.stdout.write('Run: python manage.py migrate')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Migration check failed: {str(e)}')
            )

    def show_connection_info(self, db_conn):
        """Show connection pool information."""
        self.stdout.write('\n🔗 Connection Information:')
        self.stdout.write('-' * 30)
        
        try:
            # Check if connection is usable
            if db_conn.is_usable():
                self.stdout.write(self.style.SUCCESS('✅ Connection is usable'))
            else:
                self.stdout.write(self.style.WARNING('⚠️  Connection may have issues'))
                
            # Show connection queries count
            queries_count = len(connection.queries)
            self.stdout.write(f'Queries executed: {queries_count}')
            
            # Show connection settings
            conn_max_age = db_conn.settings_dict.get('CONN_MAX_AGE', 0)
            self.stdout.write(f'Connection max age: {conn_max_age}s')
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Could not get connection info: {str(e)}')
            )
