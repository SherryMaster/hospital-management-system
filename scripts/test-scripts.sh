#!/bin/bash

# Hospital Management System - Script Testing Utility
# This script tests all development scripts to ensure they work correctly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🏥 Hospital Management System - Script Testing"
echo "=============================================="

# Check if we're in the project root
if [ ! -f "README.md" ] || [ ! -d "scripts" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Testing development scripts..."

# Test 1: Check if all scripts exist
print_info "Test 1: Checking script files..."

scripts_to_check=(
    "scripts/dev-start.sh"
    "scripts/dev-start.bat"
    "scripts/dev-start.ps1"
    "scripts/dev-manage.sh"
    "scripts/backend-start.sh"
    "scripts/frontend-start.sh"
    "scripts/db-setup.sh"
    "scripts/init-database.sh"
)

missing_scripts=()

for script in "${scripts_to_check[@]}"; do
    if [ -f "$script" ]; then
        print_status "Found: $script"
    else
        print_error "Missing: $script"
        missing_scripts+=("$script")
    fi
done

if [ ${#missing_scripts[@]} -gt 0 ]; then
    print_error "Missing scripts found. Please ensure all scripts are created."
    exit 1
fi

# Test 2: Check script permissions
print_info "Test 2: Checking script permissions..."

for script in "${scripts_to_check[@]}"; do
    if [[ "$script" == *.sh ]]; then
        if [ -x "$script" ]; then
            print_status "Executable: $script"
        else
            print_warning "Not executable: $script (fixing...)"
            chmod +x "$script"
            print_status "Fixed permissions: $script"
        fi
    fi
done

# Test 3: Check script syntax
print_info "Test 3: Checking script syntax..."

for script in "${scripts_to_check[@]}"; do
    if [[ "$script" == *.sh ]]; then
        if bash -n "$script"; then
            print_status "Syntax OK: $script"
        else
            print_error "Syntax error in: $script"
            exit 1
        fi
    fi
done

# Test 4: Check project structure
print_info "Test 4: Checking project structure..."

required_dirs=(
    "backend"
    "frontend"
    "scripts"
    "docs"
    "deployment"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Directory exists: $dir"
    else
        print_error "Missing directory: $dir"
        exit 1
    fi
done

# Test 5: Check key files
print_info "Test 5: Checking key files..."

key_files=(
    "backend/manage.py"
    "backend/requirements.txt"
    "backend/.env.example"
    "frontend/package.json"
    "frontend/.env.example"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "Makefile"
    "package.json"
)

for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "File exists: $file"
    else
        print_error "Missing file: $file"
        exit 1
    fi
done

# Test 6: Test development manager help
print_info "Test 6: Testing development manager help..."

if bash scripts/dev-manage.sh info > /dev/null 2>&1; then
    print_status "Development manager info command works"
else
    print_error "Development manager info command failed"
    exit 1
fi

# Test 7: Test status check
print_info "Test 7: Testing status check..."

if bash scripts/dev-manage.sh status > /dev/null 2>&1; then
    print_status "Status check command works"
else
    print_error "Status check command failed"
    exit 1
fi

# Test 8: Check if Python and Node.js are available (optional)
print_info "Test 8: Checking development dependencies..."

if command -v python &> /dev/null; then
    python_version=$(python --version 2>&1)
    print_status "Python found: $python_version"
else
    print_warning "Python not found (required for backend development)"
fi

if command -v node &> /dev/null; then
    node_version=$(node --version 2>&1)
    print_status "Node.js found: $node_version"
else
    print_warning "Node.js not found (required for frontend development)"
fi

if command -v npm &> /dev/null; then
    npm_version=$(npm --version 2>&1)
    print_status "npm found: $npm_version"
else
    print_warning "npm not found (required for frontend development)"
fi

# Test 9: Check Docker availability (optional)
print_info "Test 9: Checking Docker availability..."

if command -v docker &> /dev/null; then
    if docker info > /dev/null 2>&1; then
        print_status "Docker is available and running"
    else
        print_warning "Docker is installed but not running"
    fi
else
    print_warning "Docker not found (optional for development)"
fi

if command -v docker-compose &> /dev/null; then
    docker_compose_version=$(docker-compose --version 2>&1)
    print_status "Docker Compose found: $docker_compose_version"
else
    print_warning "Docker Compose not found (optional for development)"
fi

# Test 10: Check Make availability (optional)
print_info "Test 10: Checking Make availability..."

if command -v make &> /dev/null; then
    make_version=$(make --version 2>&1 | head -n1)
    print_status "Make found: $make_version"
else
    print_warning "Make not found (optional for convenience commands)"
fi

print_info "Script testing completed!"
echo ""
print_status "All development scripts are properly configured!"
echo ""
print_info "Next steps:"
echo "1. Run 'make setup' or 'bash scripts/dev-manage.sh setup' for initial setup"
echo "2. Run 'make dev' or 'bash scripts/dev-start.sh' to start development"
echo "3. Use 'bash scripts/dev-manage.sh' for interactive management"
echo ""
print_status "Happy coding! 🚀"
