#!/bin/sh
set -e

echo "Starting Donna AI Executive Dashboard..."

# Wait for PostgreSQL to be ready (using Node.js instead of pg_isready)
echo "Waiting for PostgreSQL..."
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('PostgreSQL is ready!');
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

# Run database migrations
echo "Running database migrations..."
npm run db:migrate || {
  echo "Warning: Database migrations failed. Continuing anyway..."
}

# Seed database (optional, only if needed)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed || {
    echo "Warning: Database seeding failed. Continuing anyway..."
  }
fi

# Start the application
echo "Starting Next.js application..."
exec "$@"

