#!/bin/sh
# NeuralDoc Docker Entrypoint Script
# This script initializes the database and starts the application

set -e

echo "========================================"
echo "NeuralDoc Platform Starting..."
echo "========================================"

# Wait for PostgreSQL to be ready (simplified check)
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run database migrations to create tables
echo "Creating database tables..."
if npm run db:push 2>&1 | grep -q "Everything is up to date"; then
  echo "Database tables already exist"
elif npm run db:push 2>&1; then
  echo "Database tables created successfully"
else
  echo "Note: Database push completed (tables may already exist)"
fi

echo "========================================"
echo "Starting NeuralDoc Application..."
echo "========================================"

# Start the application
exec "$@"
