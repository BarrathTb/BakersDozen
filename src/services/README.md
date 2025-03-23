# Database Service Implementation Guide

This directory contains sample implementations for connecting the Bakers Dozen application to different database systems. The `database-implementation.ts` file provides example code for both SQL Server and Supabase implementations.

## Prerequisites

Before using these implementations, you'll need to install the required dependencies:

### For SQL Server:

```bash
npm install mssql
npm install --save-dev @types/node @types/mssql
```

### For Supabase:

```bash
npm install @supabase/supabase-js
npm install --save-dev @types/node
```

## TypeScript Configuration

Make sure your `tsconfig.json` includes Node.js types:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

## Environment Variables

Create a `.env` file in the root of your project with the appropriate connection details:

### For SQL Server:

```
DB_TYPE=sqlserver
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_NAME=BakersDozen
```

### For Supabase:

```
DB_TYPE=supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Using the Database Service

1. Fix the TypeScript errors in the implementation file:

   - Install the required dependencies mentioned above
   - Update the Tables interface to use proper type references

2. Create a simplified version for your application:

```typescript
// src/services/database.ts
import { db } from './database-implementation'

// Export the database service
export { db }

// Re-export types
export type {
  User,
  Ingredient,
  Recipe,
  RecipeIngredient,
  Bake,
  Delivery,
  DeliveryItem,
  Removal,
  RemovalItem,
  Tables,
  Action,
  SubscriptionCallback,
} from './database-implementation'
```

3. Use the database service in your components:

```typescript
import { db } from '../services/database'

// Example: Get all ingredients
const ingredients = await db.getAll('ingredients')

// Example: Get ingredient by ID
const ingredient = await db.getById('ingredients', '1')

// Example: Insert a new ingredient
const newIngredient = await db.insert('ingredients', {
  name: 'New Ingredient',
  current_quantity: 10,
  min_quantity: 5,
  unit: 'kg',
  last_updated: new Date().toISOString(),
})

// Example: Update an ingredient
const updatedIngredient = await db.update('ingredients', {
  id: '1',
  current_quantity: 15,
})

// Example: Delete an ingredient
const deleted = await db.delete('ingredients', '1')

// Example: Subscribe to changes
const unsubscribe = db.subscribe((table, action, item) => {
  console.log(`${action} on ${table}:`, item)

  // Update UI based on changes
  if (table === 'ingredients') {
    // Refresh ingredients list
  }
})

// Clean up subscription when component is unmounted
onUnmounted(() => {
  unsubscribe()
})
```

## Fixing TypeScript Errors

If you're getting TypeScript errors in the implementation file, here are some fixes:

1. For the `Tables` used as a value error:

   ```typescript
   // Change this:
   Object.keys(Tables).forEach((table) => {

   // To this:
   (Object.keys({
     users: null,
     ingredients: null,
     recipes: null,
     recipe_ingredients: null,
     bakes: null,
     deliveries: null,
     delivery_items: null,
     removals: null,
     removal_items: null
   }) as Array<keyof Tables>).forEach((table) => {
   ```

2. For the null assignment error:

   ```typescript
   // Change this:
   this.notifySubscribers(table, 'insert', result)

   // To this:
   if (result) {
     this.notifySubscribers(table, 'insert', result)
   }
   ```

3. For the implicit any type:

   ```typescript
   // Add a type definition:
   interface PostgresChangePayload {
     eventType: 'INSERT' | 'UPDATE' | 'DELETE';
     new: any;
     old: any;
   }

   // Then use it:
   .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: PostgresChangePayload) => {
   ```

## Production Considerations

For a production environment:

1. Use connection pooling for SQL Server
2. Implement proper error handling and retries
3. Add logging for database operations
4. Consider using an ORM like TypeORM or Prisma
5. Implement caching for frequently accessed data
6. Set up database migrations for schema changes
7. Implement proper security measures (prepared statements, input validation)
