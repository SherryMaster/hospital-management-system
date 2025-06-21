# Hospital Management System - Makefile
# Convenient commands for development and deployment

.PHONY: help dev dev-docker setup install clean test lint format logs status health stop info

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)🏥 Hospital Management System - Development Commands$(NC)"
	@echo "=================================================="
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make setup    - Initial project setup"
	@echo "  make dev      - Start development environment"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start local development environment
	@echo "$(BLUE)Starting local development environment...$(NC)"
	@bash scripts/dev-start.sh

dev-docker: ## Start development environment with Docker
	@echo "$(BLUE)Starting Docker development environment...$(NC)"
	@bash scripts/dev-start.sh --docker

setup: ## Initial project setup
	@echo "$(BLUE)Running initial project setup...$(NC)"
	@bash scripts/dev-manage.sh setup

install: ## Install/update all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@bash scripts/dev-manage.sh install

clean: ## Clean build artifacts and caches
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@bash scripts/dev-manage.sh clean

reset: ## Reset development environment (DANGER!)
	@echo "$(RED)⚠️  This will reset your development environment!$(NC)"
	@bash scripts/dev-manage.sh reset

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@bash scripts/dev-manage.sh test-backend
	@bash scripts/dev-manage.sh test-frontend

test-backend: ## Run backend tests only
	@echo "$(BLUE)Running backend tests...$(NC)"
	@bash scripts/dev-manage.sh test-backend

test-frontend: ## Run frontend tests only
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@bash scripts/dev-manage.sh test-frontend

lint: ## Run code linting
	@echo "$(BLUE)Running code linting...$(NC)"
	@bash scripts/dev-manage.sh lint

format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	@bash scripts/dev-manage.sh format

logs: ## View all logs
	@echo "$(BLUE)Viewing logs...$(NC)"
	@bash scripts/dev-manage.sh logs

logs-backend: ## View backend logs
	@echo "$(BLUE)Viewing backend logs...$(NC)"
	@bash scripts/dev-manage.sh logs-backend

logs-frontend: ## View frontend logs
	@echo "$(BLUE)Viewing frontend logs...$(NC)"
	@bash scripts/dev-manage.sh logs-frontend

status: ## Check service status
	@echo "$(BLUE)Checking service status...$(NC)"
	@bash scripts/dev-manage.sh status

health: ## Run system health check
	@echo "$(BLUE)Running health check...$(NC)"
	@bash scripts/dev-manage.sh health

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@bash scripts/dev-manage.sh stop

info: ## Show project information
	@echo "$(BLUE)Project information:$(NC)"
	@bash scripts/dev-manage.sh info

# Database commands
db-health: ## Check database health
	@echo "$(BLUE)Checking database health...$(NC)"
	@bash scripts/dev-manage.sh db-health

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@bash scripts/dev-manage.sh migrate

db-reset: ## Reset database (DANGER!)
	@echo "$(RED)⚠️  This will delete all data!$(NC)"
	@bash scripts/dev-manage.sh db-reset

superuser: ## Create Django superuser
	@echo "$(BLUE)Creating superuser...$(NC)"
	@bash scripts/dev-manage.sh superuser

# Docker commands
docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker-compose build

docker-up: ## Start Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d

docker-down: ## Stop Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose down

docker-logs: ## View Docker logs
	@echo "$(BLUE)Viewing Docker logs...$(NC)"
	@docker-compose logs -f

docker-clean: ## Clean Docker resources
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	@docker-compose down -v
	@docker system prune -f

# Production commands
build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	@cd backend && python manage.py collectstatic --noinput
	@cd frontend && npm run build

deploy-check: ## Check deployment readiness
	@echo "$(BLUE)Checking deployment readiness...$(NC)"
	@cd backend && python manage.py check --deploy

# Quick development workflow
quick-start: setup dev ## Quick start: setup + dev

restart: stop dev ## Restart development environment

# Show project structure
tree: ## Show project structure
	@echo "$(BLUE)Project structure:$(NC)"
	@tree -I 'node_modules|venv|__pycache__|*.pyc|.git|dist|build' -L 3

# Backup database
backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@bash scripts/db-setup.sh backup
