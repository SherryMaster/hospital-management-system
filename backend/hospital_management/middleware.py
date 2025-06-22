"""
Custom Security Middleware for Hospital Management System

Implements security controls, audit logging, and monitoring
"""

import json
import logging
import time
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse, HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.urls import resolve
from django.utils import timezone
from django.db import connection
import ipaddress

User = get_user_model()

# Configure loggers
security_logger = logging.getLogger('security')
auth_logger = logging.getLogger('authentication')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to all responses"""
    
    def process_response(self, request, response):
        security_headers = getattr(settings, 'SECURITY_HEADERS', {})
        
        for header, value in security_headers.items():
            response[header] = value
        
        # Add CSP header
        csp_directives = []
        if hasattr(settings, 'CSP_DEFAULT_SRC'):
            csp_directives.append(f"default-src {' '.join(settings.CSP_DEFAULT_SRC)}")
        if hasattr(settings, 'CSP_SCRIPT_SRC'):
            csp_directives.append(f"script-src {' '.join(settings.CSP_SCRIPT_SRC)}")
        if hasattr(settings, 'CSP_STYLE_SRC'):
            csp_directives.append(f"style-src {' '.join(settings.CSP_STYLE_SRC)}")
        if hasattr(settings, 'CSP_IMG_SRC'):
            csp_directives.append(f"img-src {' '.join(settings.CSP_IMG_SRC)}")
        if hasattr(settings, 'CSP_OBJECT_SRC'):
            csp_directives.append(f"object-src {' '.join(settings.CSP_OBJECT_SRC)}")
        if hasattr(settings, 'CSP_BASE_URI'):
            csp_directives.append(f"base-uri {' '.join(settings.CSP_BASE_URI)}")
        if hasattr(settings, 'CSP_FRAME_ANCESTORS'):
            csp_directives.append(f"frame-ancestors {' '.join(settings.CSP_FRAME_ANCESTORS)}")
        
        if csp_directives:
            response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        return response


class AuditLogMiddleware(MiddlewareMixin):
    """Log all API requests for audit trail compliance"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        # Store request start time
        request._audit_start_time = time.time()
        
        # Log request details
        if self.should_log_request(request):
            self.log_request(request)
    
    def process_response(self, request, response):
        # Log response details
        if self.should_log_request(request):
            self.log_response(request, response)
        
        return response
    
    def should_log_request(self, request):
        """Determine if request should be logged"""
        # Log API requests and sensitive operations
        path = request.path
        
        # Always log authentication endpoints
        if '/api/auth/' in path:
            return True
        
        # Log all API requests for audit trail
        if path.startswith('/api/'):
            return True
        
        # Log admin access
        if path.startswith('/admin/'):
            return True
        
        return False
    
    def log_request(self, request):
        """Log incoming request"""
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'event_type': 'request',
            'method': request.method,
            'path': request.path,
            'user_id': user_id,
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'referer': request.META.get('HTTP_REFERER', ''),
        }
        
        # Log query parameters (excluding sensitive data)
        if request.GET:
            safe_params = {k: v for k, v in request.GET.items() 
                          if k.lower() not in ['password', 'token', 'key']}
            log_data['query_params'] = safe_params
        
        auth_logger.info(f"Request: {json.dumps(log_data)}")
    
    def log_response(self, request, response):
        """Log response details"""
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None
        duration = time.time() - getattr(request, '_audit_start_time', 0)
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'event_type': 'response',
            'method': request.method,
            'path': request.path,
            'user_id': user_id,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'ip_address': self.get_client_ip(request),
        }
        
        # Log security events
        if response.status_code in [401, 403, 429]:
            security_logger.warning(f"Security event: {json.dumps(log_data)}")
        else:
            auth_logger.info(f"Response: {json.dumps(log_data)}")
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class IPWhitelistMiddleware(MiddlewareMixin):
    """Restrict admin access to whitelisted IPs"""
    
    def process_request(self, request):
        # Only apply to admin URLs
        if not request.path.startswith('/admin/'):
            return None
        
        client_ip = self.get_client_ip(request)
        whitelist = getattr(settings, 'ADMIN_IP_WHITELIST', [])
        
        if not whitelist:
            return None
        
        # Check if IP is whitelisted
        if not self.is_ip_whitelisted(client_ip, whitelist):
            security_logger.warning(
                f"Admin access denied for IP {client_ip} - not in whitelist"
            )
            return HttpResponseForbidden("Access denied: IP not whitelisted")
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_ip_whitelisted(self, client_ip, whitelist):
        """Check if IP is in whitelist"""
        try:
            client_ip_obj = ipaddress.ip_address(client_ip)
            
            for allowed_ip in whitelist:
                try:
                    # Handle both single IPs and CIDR ranges
                    if '/' in allowed_ip:
                        network = ipaddress.ip_network(allowed_ip, strict=False)
                        if client_ip_obj in network:
                            return True
                    else:
                        allowed_ip_obj = ipaddress.ip_address(allowed_ip)
                        if client_ip_obj == allowed_ip_obj:
                            return True
                except ValueError:
                    continue
            
            return False
        except ValueError:
            return False


class RateLimitMiddleware(MiddlewareMixin):
    """Advanced rate limiting middleware"""
    
    def process_request(self, request):
        # Get client identifier
        client_id = self.get_client_identifier(request)
        
        # Check different rate limits
        if self.is_rate_limited(request, client_id):
            security_logger.warning(
                f"Rate limit exceeded for {client_id} on {request.path}"
            )
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'},
                status=429
            )
        
        return None
    
    def get_client_identifier(self, request):
        """Get unique identifier for client"""
        # Use user ID if authenticated, otherwise IP
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user:{request.user.id}"
        else:
            ip = self.get_client_ip(request)
            return f"ip:{ip}"
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_rate_limited(self, request, client_id):
        """Check if request should be rate limited"""
        # Define rate limits for different endpoints
        rate_limits = {
            '/api/auth/login/': {'limit': 5, 'window': 300},  # 5 attempts per 5 minutes
            '/api/auth/register/': {'limit': 3, 'window': 3600},  # 3 attempts per hour
            '/api/auth/password-reset/': {'limit': 3, 'window': 3600},  # 3 attempts per hour
        }
        
        # Check specific endpoint limits
        for endpoint, config in rate_limits.items():
            if request.path.startswith(endpoint):
                return self.check_rate_limit(client_id, endpoint, config)
        
        # General API rate limit
        if request.path.startswith('/api/'):
            general_limit = {'limit': 100, 'window': 3600}  # 100 requests per hour
            return self.check_rate_limit(client_id, 'general_api', general_limit)
        
        return False
    
    def check_rate_limit(self, client_id, endpoint, config):
        """Check rate limit for specific endpoint"""
        cache_key = f"rate_limit:{client_id}:{endpoint}"
        current_time = int(time.time())
        window_start = current_time - config['window']
        
        # Get current request timestamps
        requests = cache.get(cache_key, [])
        
        # Remove old requests outside the window
        requests = [req_time for req_time in requests if req_time > window_start]
        
        # Check if limit exceeded
        if len(requests) >= config['limit']:
            return True
        
        # Add current request
        requests.append(current_time)
        cache.set(cache_key, requests, config['window'])
        
        return False


class SecurityMonitoringMiddleware(MiddlewareMixin):
    """Monitor for suspicious activities and security threats"""
    
    def process_request(self, request):
        # Check for suspicious patterns
        if self.detect_suspicious_activity(request):
            self.handle_suspicious_activity(request)
        
        return None
    
    def detect_suspicious_activity(self, request):
        """Detect suspicious request patterns"""
        suspicious_patterns = [
            # SQL injection patterns
            r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
            # XSS patterns
            r"(<script|javascript:|on\w+\s*=)",
            # Path traversal
            r"(\.\./|\.\.\\)",
            # Command injection
            r"(;|\||&|`|\$\()",
        ]
        
        # Check URL and parameters
        full_url = request.get_full_path()
        
        import re
        for pattern in suspicious_patterns:
            if re.search(pattern, full_url, re.IGNORECASE):
                return True
        
        # Check POST data
        if request.method == 'POST':
            try:
                if hasattr(request, 'body') and request.body:
                    body_str = request.body.decode('utf-8', errors='ignore')
                    for pattern in suspicious_patterns:
                        if re.search(pattern, body_str, re.IGNORECASE):
                            return True
            except:
                pass
        
        return False
    
    def handle_suspicious_activity(self, request):
        """Handle detected suspicious activity"""
        client_ip = self.get_client_ip(request)
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None
        
        security_event = {
            'timestamp': timezone.now().isoformat(),
            'event_type': 'suspicious_activity',
            'ip_address': client_ip,
            'user_id': user_id,
            'path': request.path,
            'method': request.method,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'full_url': request.get_full_path(),
        }
        
        security_logger.critical(f"Suspicious activity detected: {json.dumps(security_event)}")
        
        # Optionally block the IP temporarily
        self.temporary_ip_block(client_ip)
    
    def temporary_ip_block(self, ip_address):
        """Temporarily block suspicious IP"""
        cache_key = f"blocked_ip:{ip_address}"
        cache.set(cache_key, True, 3600)  # Block for 1 hour
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SessionSecurityMiddleware(MiddlewareMixin):
    """Enhanced session security"""

    def process_request(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Check session timeout
            if self.is_session_expired(request):
                self.logout_user(request)
                return JsonResponse(
                    {'error': 'Session expired. Please log in again.'},
                    status=401
                )

            # Update last activity
            request.session['last_activity'] = timezone.now().timestamp()

            # Check for session hijacking
            if self.detect_session_hijacking(request):
                self.logout_user(request)
                security_logger.critical(
                    f"Potential session hijacking detected for user {request.user.id}"
                )
                return JsonResponse(
                    {'error': 'Security violation detected. Please log in again.'},
                    status=401
                )

        return None

    def is_session_expired(self, request):
        """Check if session has expired"""
        last_activity = request.session.get('last_activity')
        if not last_activity:
            return False

        timeout_seconds = getattr(settings, 'SESSION_COOKIE_AGE', 1800)
        current_time = timezone.now().timestamp()

        return (current_time - last_activity) > timeout_seconds

    def detect_session_hijacking(self, request):
        """Detect potential session hijacking"""
        # Check IP address consistency
        session_ip = request.session.get('ip_address')
        current_ip = self.get_client_ip(request)

        if session_ip and session_ip != current_ip:
            return True

        # Store IP if not set
        if not session_ip:
            request.session['ip_address'] = current_ip

        # Check User-Agent consistency
        session_ua = request.session.get('user_agent')
        current_ua = request.META.get('HTTP_USER_AGENT', '')

        if session_ua and session_ua != current_ua:
            return True

        # Store User-Agent if not set
        if not session_ua:
            request.session['user_agent'] = current_ua

        return False

    def logout_user(self, request):
        """Securely logout user"""
        from django.contrib.auth import logout
        logout(request)
        request.session.flush()

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PerformanceMiddleware(MiddlewareMixin):
    """Performance monitoring and optimization middleware"""

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Store request start time and initial memory usage
        request._performance_start_time = time.time()
        request._performance_start_queries = len(connection.queries)

        # Add performance headers
        request.META['HTTP_X_REQUEST_ID'] = self.generate_request_id()

        return None

    def process_response(self, request, response):
        # Calculate performance metrics
        if hasattr(request, '_performance_start_time'):
            duration = time.time() - request._performance_start_time
            query_count = len(connection.queries) - getattr(request, '_performance_start_queries', 0)

            # Add performance headers to response
            response['X-Response-Time'] = f'{duration:.3f}s'
            response['X-Query-Count'] = str(query_count)
            response['X-Request-ID'] = request.META.get('HTTP_X_REQUEST_ID', '')

            # Log slow requests
            if duration > getattr(settings, 'SLOW_REQUEST_THRESHOLD', 1.0):
                self.log_slow_request(request, response, duration, query_count)

            # Log performance metrics
            self.log_performance_metrics(request, response, duration, query_count)

        return response

    def generate_request_id(self):
        """Generate unique request ID"""
        import uuid
        return str(uuid.uuid4())[:8]

    def log_slow_request(self, request, response, duration, query_count):
        """Log slow requests for analysis"""
        performance_logger = logging.getLogger('performance')

        log_data = {
            'timestamp': timezone.now().isoformat(),
            'event_type': 'slow_request',
            'method': request.method,
            'path': request.path,
            'duration': duration,
            'query_count': query_count,
            'status_code': response.status_code,
            'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }

        performance_logger.warning(f"Slow request: {json.dumps(log_data)}")

    def log_performance_metrics(self, request, response, duration, query_count):
        """Log performance metrics for monitoring"""
        # Store metrics in cache for dashboard
        cache_key = f"performance_metrics:{timezone.now().strftime('%Y%m%d%H')}"

        metrics = cache.get(cache_key, {
            'total_requests': 0,
            'total_duration': 0,
            'total_queries': 0,
            'slow_requests': 0,
            'error_requests': 0,
        })

        metrics['total_requests'] += 1
        metrics['total_duration'] += duration
        metrics['total_queries'] += query_count

        if duration > 1.0:  # Slow request threshold
            metrics['slow_requests'] += 1

        if response.status_code >= 400:
            metrics['error_requests'] += 1

        cache.set(cache_key, metrics, 3600)  # Store for 1 hour

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
