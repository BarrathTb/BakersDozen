# Database Setup Guide for Bakers Dozen

This guide explains how to set up the database for the Bakers Dozen application using either SQL Server or PostgreSQL/Supabase.

## Option 1: SQL Server Setup

### Creating the Database

1. **Open SQL Server Management Studio (SSMS)**

   - Connect to your SQL Server instance

2. **Create a new database**

   - Right-click on "Databases" in the Object Explorer
   - Select "New Database"
   - Enter "BakersDozen" as the database name
   - Click "OK"

3. **Run the SQL script**
   - Open the `supabase/migrations/20250321_initial_schema.sql` file
   - In SSMS, with the BakersDozen database selected, click "New Query"
   - Paste the contents of the SQL file
   - Click "Execute"

### Connection String

For SQL Server, you'll need a connection string like this in your `.env` file:

```
DB_CONNECTION_STRING=Server=localhost;Database=BakersDozen;Trusted_Connection=True;
```

If you're using SQL authentication instead of Windows authentication:

```
DB_CONNECTION_STRING=Server=localhost;Database=BakersDozen;User Id=YourUsername;Password=YourPassword;
```

### Connecting in Code

In your application, you would connect to the database using a library like `mssql`:

```typescript
import sql from 'mssql'

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true, // For development only
  },
}

async function connectToDatabase() {
  try {
    await sql.connect(config)
    console.log('Connected to SQL Server database')
  } catch (err) {
    console.error('Database connection error:', err)
  }
}
```

## Option 2: PostgreSQL/Supabase Setup

### Local PostgreSQL Setup

1. **Install PostgreSQL** if you haven't already

2. **Create a new database**

   ```bash
   createdb bakersDozen
   ```

3. **Run the SQL script**
   ```bash
   psql -d bakersDozen -f supabase/migrations/20250321_initial_schema_postgres.sql
   ```

### Supabase Setup

1. **Create a Supabase project**

   - Go to [supabase.com](https://supabase.com/) and sign in
   - Create a new project
   - Note your project URL and API keys

2. **Run the SQL script in the SQL Editor**
   - In your Supabase dashboard, go to the SQL Editor
   - Create a new query
   - Paste the contents of `supabase/migrations/20250321_initial_schema_postgres.sql`
   - Run the query

### Environment Variables

For Supabase, you'll need these environment variables in your `.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project dashboard under Project Settings > API.

### Connecting in Code

To connect to Supabase in your application:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Example query
async function getIngredients() {
  const { data, error } = await supabase.from('ingredients').select('*')

  if (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }

  return data
}
```

## Updating the Application Code

After setting up the database, you'll need to update your application code to use the database connection:

1. **Create a database service file** (e.g., `src/services/database.ts`) that exports functions for interacting with the database

2. **Update components** to use the database service instead of the localStorage implementation

3. **Update environment variables** in your deployment environment

## Testing the Connection

To test if your database connection is working:

```typescript
// For SQL Server
async function testConnection() {
  try {
    await sql.connect(config)
    const result = await sql.query`SELECT TOP 1 * FROM users`
    console.log('Connection successful:', result.recordset)
    await sql.close()
  } catch (err) {
    console.error('Database connection test failed:', err)
  }
}

// For Supabase
async function testConnection() {
  const { data, error } = await supabase.from('users').select('*').limit(1)

  if (error) {
    console.error('Supabase connection test failed:', error)
  } else {
    console.log('Supabase connection successful:', data)
  }
}
```

## Migrating from localStorage to the Database

If you're currently using the localStorage implementation and want to migrate to a real database:

1. Keep the same interface in your database service so components don't need major changes
2. Update the implementation to use SQL queries instead of localStorage operations
3. Test thoroughly to ensure data integrity

The database schema is designed to match the structure used in the localStorage implementation, so the migration should be relatively straightforward.
