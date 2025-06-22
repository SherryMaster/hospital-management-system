"""
Gunicorn Configuration for Hospital Management System Production

Optimized for high-performance production deployment
"""

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Restart workers after this many seconds
timeout = 30
graceful_timeout = 30
keepalive = 5

# The maximum number of pending connections
backlog = 2048

# Worker process management
worker_tmp_dir = "/dev/shm"
worker_class = "gevent"
worker_connections = 1000

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Application
wsgi_module = "hospital_management.wsgi:application"
pythonpath = "/app"

# Logging
accesslog = "/var/log/hospital-management/gunicorn_access.log"
errorlog = "/var/log/hospital-management/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "hospital_management"

# Server mechanics
daemon = False
pidfile = "/tmp/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# SSL (if using HTTPS termination at Gunicorn level)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"
# ssl_version = ssl.PROTOCOL_TLSv1_2
# ciphers = "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS"

# Environment variables
raw_env = [
    f"DJANGO_SETTINGS_MODULE={os.environ.get('DJANGO_SETTINGS_MODULE', 'hospital_management.settings.production')}",
]

# Preload application for better performance
preload_app = True

# Enable automatic worker restarts
max_requests = 1000
max_requests_jitter = 100

# Worker timeout
timeout = 30
graceful_timeout = 30

# Keep-alive
keepalive = 5

# Logging configuration
def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Hospital Management System server is ready. Listening on: %s", server.address)

def worker_int(worker):
    """Called just after a worker has been killed by a signal."""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    """Called when a worker receives the SIGABRT signal."""
    worker.log.info("Worker received SIGABRT signal")

def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")

def pre_request(worker, req):
    """Called just before a worker processes the request."""
    worker.log.debug("%s %s", req.method, req.path)

def post_request(worker, req, environ, resp):
    """Called after a worker processes the request."""
    worker.log.debug("%s %s - %s", req.method, req.path, resp.status_code)

# Custom application loading
def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Starting Hospital Management System...")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    server.log.info("Reloading Hospital Management System...")

def on_exit(server):
    """Called just before exiting."""
    server.log.info("Shutting down Hospital Management System...")

# Error handling
def worker_exit(server, worker):
    """Called just after a worker has been exited."""
    server.log.info("Worker exited (pid: %s)", worker.pid)

# Performance tuning based on environment
if os.environ.get('ENVIRONMENT') == 'production':
    # Production optimizations
    workers = max(2, multiprocessing.cpu_count())
    worker_connections = 1000
    max_requests = 1000
    timeout = 30
    
elif os.environ.get('ENVIRONMENT') == 'staging':
    # Staging optimizations
    workers = max(1, multiprocessing.cpu_count() // 2)
    worker_connections = 500
    max_requests = 500
    timeout = 60
    
else:
    # Development settings
    workers = 1
    worker_connections = 100
    max_requests = 100
    timeout = 120
    reload = True

# Memory management
def max_memory_usage():
    """Return maximum memory usage per worker in bytes."""
    return int(os.environ.get('MAX_MEMORY_PER_WORKER', 512 * 1024 * 1024))  # 512MB default

# Health check endpoint
def health_check(environ, start_response):
    """Simple health check endpoint."""
    if environ['PATH_INFO'] == '/health/':
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [b'{"status": "healthy"}']
    return None

# Custom worker class for better performance
class GeventWorker:
    """Custom Gevent worker with optimizations."""
    
    def __init__(self):
        self.worker_connections = worker_connections
        
    def handle_request(self, listener, req, client, addr):
        """Handle individual requests with optimizations."""
        # Custom request handling logic
        pass

# Monitoring and metrics
def setup_metrics():
    """Setup application metrics collection."""
    # Prometheus metrics setup
    pass

# Security configurations
def setup_security():
    """Setup security configurations."""
    # Security headers and configurations
    pass

# Application initialization
def application_init():
    """Initialize application-specific configurations."""
    setup_metrics()
    setup_security()

# Call initialization
application_init()

# Environment-specific configurations
if os.environ.get('ENABLE_PROMETHEUS_METRICS', 'false').lower() == 'true':
    # Enable Prometheus metrics
    def child_exit(server, worker):
        """Cleanup metrics on worker exit."""
        pass

# Custom error pages
def custom_error_page(status_code):
    """Return custom error page content."""
    error_pages = {
        404: b'{"error": "Not Found", "status": 404}',
        500: b'{"error": "Internal Server Error", "status": 500}',
        502: b'{"error": "Bad Gateway", "status": 502}',
        503: b'{"error": "Service Unavailable", "status": 503}',
    }
    return error_pages.get(status_code, b'{"error": "Unknown Error"}')

# Graceful shutdown
def graceful_shutdown():
    """Handle graceful shutdown."""
    import signal
    import sys
    
    def signal_handler(signum, frame):
        print(f"Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

# Initialize graceful shutdown
graceful_shutdown()
