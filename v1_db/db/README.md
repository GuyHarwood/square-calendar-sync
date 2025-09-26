# Database Configuration

This directory contains database migration and configuration files for the Square Cal Sync application.

## Environment Variables

Configure the following environment variables for database connectivity:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `DB_HOST` | Database server hostname | `localhost` |
| `DB_PORT` | Database server port | `5432` |
| `DB_NAME` | Database name | `appoint` |
| `DB_USER` | Database username | `appoint` |
| `DB_PASSWORD` | Database password | `appoint` |
| `PGADMIN_EMAIL` | pgAdmin login email | `admin@example.com` |
| `PGLADMIN_PASSWORD` | pgAdmin login password | `admin` |
| `PGLADMIN_PORT` | pgAdmin web interface port | `8080` |

## Files

- `config.js` - Database configuration with environment variable support
- `migrate.js` - Database migration script using Postgrator
- `migrations/` - Directory containing database migration files
- `pgadmin/servers.json` - Pre-configured pgAdmin server connections

## Usage

### Option 1: Using Docker (Recommended)

1. From the project root, start the PostgreSQL and pgAdmin containers:
   ```bash
   docker-compose up -d
   ```

2. The database will be available with default settings. To customize, create a `.env` file in the project root:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. Run migrations:
   ```bash
   cd db
   node migrate.js
   ```

4. Access pgAdmin at http://localhost:8080
   - Login with: admin@example.com / admin (or your configured credentials)
   - The "Square Cal Sync DB" server connection will be automatically available
   - You'll need to enter the database password (`appoint` by default) when first connecting

5. Stop the containers when done:
   ```bash
   docker-compose down
   ```

### Option 2: Using Local PostgreSQL

1. Set your environment variables in a `.env` file or export them:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=your_database_name
   export DB_USER=your_username
   export DB_PASSWORD=your_password
   ```

2. Run migrations:
   ```bash
   node migrate.js
   ```

The configuration will automatically use environment variables if available, falling back to default values for development.
