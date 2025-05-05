#!/bin/sh
set -e

# Wait for the database to be ready
echo "Waiting for PostgreSQL to start..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Seed the database if needed
echo "Seeding the database..."
npm run db:seed

# Start the application
exec "$@"