# Bakers Dozen - Inventory Management System

A comprehensive inventory management system for bakeries, helping track ingredients, recipes, bakes, deliveries, and removals.

## Features

- Inventory tracking with minimum stock levels and alerts
- Recipe management with ingredient requirements
- Bake tracking with production efficiency metrics
- Delivery and removal management
- User authentication with role-based access control
- Responsive design for all screen sizes

## Migration from Supabase to Local Database

This project has been migrated from Supabase to a local database solution using localStorage. This is a temporary solution that can be replaced with a real database in the future.

### Migration Steps

1. **Remove Supabase Dependencies**

   Remove the following dependencies from your `package.json`:

   ```
   "@supabase/supabase-js": "^2.x.x"
   ```

2. **Remove Supabase Configuration**

   Remove the Supabase configuration from your `.env` file:

   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Add New Database and Auth Services**

   The following files have been added to replace Supabase:

   - `src/services/database.ts`: A localStorage-based database service
   - `src/services/auth.ts`: A localStorage-based authentication service

4. **Update Imports and API Calls**

   Run the migration script to update imports and API calls:

   ```
   node update-imports.js
   ```

   This script will:

   - Remove Supabase imports
   - Add imports for the new database and auth services
   - Update Supabase API calls to use the new services

5. **Update Auth Store**

   The auth store has been updated to use the new auth service:

   - `src/stores/auth.ts`

6. **Test the Application**

   After migration, test all features of the application to ensure they work correctly with the new database service.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Building for Production

```
npm run build
```

## Default Users

The local database is initialized with the following users:

- Admin: admin@example.com (no password required in demo mode)
- User: user@example.com (no password required in demo mode)

## Customizing the Database

The database is initialized with sample data in `src/services/database.ts`. You can modify this data to suit your needs.

## Future Improvements

- Replace localStorage with a real database
- Add offline support with IndexedDB
- Implement data export/import functionality
- Add barcode scanning for inventory management
- Implement batch tracking and expiry date management
