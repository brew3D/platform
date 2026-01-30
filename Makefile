SHELL := /bin/bash

.PHONY: dev frontend backend install

dev: ## Start full development environment (seed users + frontend + backend)
	@chmod +x ./start-dev.sh
	@./start-dev.sh

frontend: ## Start only Next.js frontend (port 5050 by default)
	@yarn install
	@yarn dev --port 5050

backend: ## Start only Python sim-backend (Flask)
	@cd sim-backend && \
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt 2>/dev/null || true && \
	python app.py

install: ## Install frontend dependencies
	@yarn install

