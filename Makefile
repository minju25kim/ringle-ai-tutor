# Ringle AI Tutor Development Makefile

.PHONY: dev install clean setup backend frontend help

# Default target
dev: setup
	@echo "🚀 Starting development servers..."
	@./dev.sh

# Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	@cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@cd frontend && pnpm install

# Setup development environment
setup:
	@echo "🔧 Setting up development environment..."
	@chmod +x dev.sh
	@if [ ! -f backend/venv/bin/activate ]; then \
		echo "Setting up Python virtual environment..."; \
		cd backend && python3 -m venv venv; \
	fi

# Start only backend
backend:
	@echo "📡 Starting backend only..."
	@cd backend && source venv/bin/activate && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start only frontend
frontend:
	@echo "🎨 Starting frontend only..."
	@cd frontend && pnpm run dev

# Clean build artifacts and dependencies
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf backend/venv
	@rm -rf frontend/node_modules
	@rm -rf frontend/.next

# Show help
help:
	@echo "Ringle AI Tutor Development Commands:"
	@echo ""
	@echo "  make dev      - Start both frontend and backend in development mode"
	@echo "  make install  - Install all dependencies"
	@echo "  make setup    - Setup development environment"
	@echo "  make backend  - Start only the backend server"
	@echo "  make frontend - Start only the frontend server"
	@echo "  make clean    - Clean all build artifacts and dependencies"
	@echo "  make help     - Show this help message"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"