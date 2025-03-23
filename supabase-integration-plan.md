# Comprehensive Supabase Integration Plan

This document outlines a complete strategy for integrating Supabase into the Bakers Dozen application, replacing the current localStorage implementation with a robust, scalable backend solution.

## Table of Contents

1. [Supabase Client Initialization](#1-supabase-client-initialization)
2. [Authentication Implementation](#2-authentication-implementation)
3. [Data Models and Schema](#3-data-models-and-schema)
4. [CRUD Operations](#4-crud-operations)
5. [Row-Level Security Policies](#5-row-level-security-policies)
6. [Real-time Subscriptions](#6-real-time-subscriptions)
7. [Error Handling](#7-error-handling)
8. [Caching and Performance](#8-caching-and-performance)
9. [Migration Strategy](#9-migration-strategy)
10. [Documentation and Examples](#10-documentation-and-examples)
11. [Implementation Timeline](#11-implementation-timeline)

## 1. Supabase Client Initialization

### Environment Variables Setup

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for admin operations only)
```

### Client Initialization

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'bakers-dozen',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Connection status monitoring
let isOffline = false

// Check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.from('health_check').select('status').single()
    isOffline = false
    return true
  } catch (error) {
    isOffline = true
    console.error('Supabase connection error:', error)
    return false
  }
}

// Get connection status
export const getConnectionStatus = (): boolean => {
  return !isOffline
}

// Initialize connection monitoring
export const initConnectionMonitoring = () => {
  checkConnection()
  setInterval(checkConnection, 30000) // Check every 30 seconds

  window.addEventListener('online', () => {
    checkConnection()
  })

  window.addEventListener('offline', () => {
    isOffline = true
  })
}
```

### Type Generation

Generate TypeScript types from your Supabase schema:

```bash
npm install -g supabase
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## 2. Authentication Implementation

Create a comprehensive authentication service:

```typescript
// src/services/auth.ts
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export const auth = {
  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data: { session: data.session }, error }
  },

  // Get current user with profile data
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { data: { user: null }, error }
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { data: { user: null }, error: profileError }
    }

    return {
      data: {
        user: {
          id: user.id,
          email: user.email || '',
          role: profile?.role || 'user',
        },
      },
      error: null,
    }
  },

  // Sign in with email and password
  async signInWithPassword(credentials) {
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    // Implementation details...
  },

  // Sign up with email and password
  async signUp(credentials) {
    const { data, error } = await supabase.auth.signUp(credentials)
    // Implementation details...
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Reset password
  async resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  },

  // Update user
  async updateUser(updates) {
    const { error } = await supabase.auth.updateUser(updates)
    return { error }
  },

  // Set up auth state change listener
  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    return data.subscription.unsubscribe
  },
}
```

## 3. Data Models and Schema

Use the PostgreSQL schema file we've already created (`supabase/migrations/20250321_initial_schema_postgres.sql`) as the foundation for our Supabase database schema.

Create type definitions for your database schema:

```typescript
// src/types/database.ts
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

// Additional interfaces for other tables...

// View types
export interface InventoryStatus {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
  status: 'Out of Stock' | 'Low Stock' | 'In Stock'
}

// Additional interfaces for other views...
```

## 4. CRUD Operations

Create a comprehensive database service:

```typescript
// src/services/database.ts
import { supabase } from './supabase'
import { getConnectionStatus } from './supabase'
import type {
  User,
  Ingredient,
  Recipe,
  RecipeIngredient,
  Bake,
  Delivery,
  DeliveryItem,
  Removal,
  RemovalItem,
} from '../types/database'

// Define table types
export interface Tables {
  users: User
  ingredients: Ingredient
  // Additional table interfaces...
}

// Define action types for subscription
export type Action = 'insert' | 'update' | 'delete'

// Define subscription callback type
export type SubscriptionCallback = (table: keyof Tables, action: Action, item: any) => void

// Database service
export const db = {
  // Get all records from a table
  async getAll<T extends keyof Tables>(table: T): Promise<Tables[T][]> {
    try {
      // Check if we're offline
      if (!getConnectionStatus()) {
        // Return cached data if available
        const cachedData = localStorage.getItem(`bakersDozen_${table}`)
        if (cachedData) {
          return JSON.parse(cachedData)
        }
        return []
      }

      const { data, error } = await supabase.from(table).select('*')

      if (error) throw error

      // Cache the data
      localStorage.setItem(`bakersDozen_${table}`, JSON.stringify(data))

      return data as Tables[T][]
    } catch (error) {
      console.error(`Error fetching all records from ${table}:`, error)

      // Return cached data if available
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        return JSON.parse(cachedData)
      }

      return []
    }
  },

  // Get a record by ID
  async getById<T extends keyof Tables>(table: T, id: string): Promise<Tables[T] | null> {
    // Implementation details...
  },

  // Query records with a filter function
  async query<T extends keyof Tables>(
    table: T,
    filterFn: (record: Tables[T]) => boolean,
  ): Promise<Tables[T][]> {
    // Implementation details...
  },

  // Insert a record
  async insert<T extends keyof Tables>(table: T, record: Partial<Tables[T]>): Promise<Tables[T]> {
    // Implementation details...
  },

  // Update a record
  async update<T extends keyof Tables>(
    table: T,
    record: Partial<Tables[T]> & { id: string },
  ): Promise<Tables[T] | null> {
    // Implementation details...
  },

  // Delete a record
  async delete<T extends keyof Tables>(table: T, id: string): Promise<boolean> {
    // Implementation details...
  },

  // Subscribe to changes
  subscribe(callback: SubscriptionCallback): () => void {
    // Implementation details...
  },
}
```

## 5. Row-Level Security Policies

Implement Row-Level Security (RLS) policies in Supabase:

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
-- Enable RLS for other tables...

-- Users table policies
CREATE POLICY "Users can view all users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Only admins can create users"
ON users FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Additional policies for other tables...
```

Ensure your frontend respects these security policies:

```typescript
// src/services/security.ts
import { useAuthStore } from '../stores/auth'

export const security = {
  // Check if user can perform an action
  canPerformAction(
    action: 'create' | 'update' | 'delete',
    resource: string,
    ownerId?: string,
  ): boolean {
    const authStore = useAuthStore()

    // Not logged in users can't do anything
    if (!authStore.isLoggedIn) {
      return false
    }

    // Admins can do anything
    if (authStore.isAdmin) {
      return true
    }

    // Regular users can create most resources
    if (action === 'create') {
      return true
    }

    // Regular users can update their own resources
    if (action === 'update' && ownerId === authStore.user?.id) {
      return true
    }

    // Regular users can't delete resources
    if (action === 'delete') {
      return false
    }

    return false
  },
}
```

## 6. Real-time Subscriptions

Create a service for managing real-time subscriptions:

```typescript
// src/services/realtime.ts
import { supabase } from './supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = string
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
type CallbackFunction = (payload: RealtimePostgresChangesPayload<any>) => void

interface Subscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

// Store active subscriptions
const activeSubscriptions: Map<string, Subscription> = new Map()

export const realtime = {
  // Subscribe to changes on a table
  subscribe(table: TableName, event: EventType = '*', callback: CallbackFunction): () => void {
    // Implementation details...
  },

  // Subscribe to changes on multiple tables
  subscribeToTables(
    tables: TableName[],
    event: EventType = '*',
    callback: (table: TableName, payload: RealtimePostgresChangesPayload<any>) => void,
  ): () => void {
    // Implementation details...
  },

  // Unsubscribe from all subscriptions
  unsubscribeAll(): void {
    // Implementation details...
  },
}
```

Example of using real-time subscriptions in a component:

```typescript
// src/components/InventoryList.vue
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { db } from '../services/database'
import { realtime } from '../services/realtime'
import type { Ingredient } from '../types/database'

export default defineComponent({
  setup() {
    const ingredients = ref<Ingredient[]>([])
    let unsubscribe: (() => void) | null = null

    const fetchIngredients = async () => {
      ingredients.value = await db.getAll('ingredients')
    }

    onMounted(async () => {
      // Initial fetch
      await fetchIngredients()

      // Subscribe to real-time updates
      unsubscribe = realtime.subscribe('ingredients', '*', (payload) => {
        // Handle real-time updates...
      })
    })

    onUnmounted(() => {
      // Clean up subscription
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return {
      ingredients,
    }
  },
})
```

## 7. Error Handling

Create a comprehensive error handling service:

```typescript
// src/services/error-handler.ts
import { ref } from 'vue'

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  DATABASE = 'database',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

// Error severity
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Error interface
export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: any
  timestamp: Date
  handled: boolean
}

// Global error state
const errors = ref<AppError[]>([])
const lastError = ref<AppError | null>(null)

export const errorHandler = {
  // Get all errors
  getErrors(): AppError[] {
    return errors.value
  },

  // Get last error
  getLastError(): AppError | null {
    return lastError.value
  },

  // Handle an error
  handleError(
    error: any,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
  ): AppError {
    // Implementation details...
  },

  // Mark error as handled
  markAsHandled(errorId: number): void {
    // Implementation details...
  },

  // Clear all errors
  clearErrors(): void {
    errors.value = []
    lastError.value = null
  },
}
```

Create error boundaries for components:

```typescript
// src/components/ErrorBoundary.vue
import { defineComponent, ref, provide, onErrorCaptured } from 'vue'
import { errorHandler } from '../services/error-handler'

export default defineComponent({
  props: {
    fallback: {
      type: Object,
      default: () => ({
        template: '<div>Something went wrong</div>',
      }),
    },
  },

  setup(props, { slots }) {
    const error = ref<Error | null>(null)

    // Provide error to child components
    provide('error', error)

    // Capture errors from child components
    onErrorCaptured((err, instance, info) => {
      error.value = err as Error
      errorHandler.handleError(err, 'component', 'error')
      return false // Prevent error from propagating
    })

    return () => {
      if (error.value) {
        return props.fallback
      }

      return slots.default?.()
    }
  },
})
```

## 8. Caching and Performance

Implement efficient caching strategies:

```typescript
// src/services/cache.ts
interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items in cache
}

class Cache<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map()
  private options: CacheOptions

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100, // 100 items default
      ...options,
    }
  }

  // Set a value in the cache
  set(key: string, value: T): void {
    // Implementation details...
  }

  // Get a value from the cache
  get(key: string): T | undefined {
    // Implementation details...
  }

  // Check if a key exists in the cache
  has(key: string): boolean {
    // Implementation details...
  }

  // Remove a value from the cache
  delete(key: string): boolean {
    // Implementation details...
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear()
  }
}

// Create cache instances for different data types
export const cacheService = {
  ingredients: new Cache<any[]>({ ttl: 5 * 60 * 1000 }), // 5 minutes
  recipes: new Cache<any[]>({ ttl: 10 * 60 * 1000 }), // 10 minutes
  users: new Cache<any[]>({ ttl: 30 * 60 * 1000 }), // 30 minutes
  // Add more caches as needed
}
```

Implement connection pooling for Supabase:

```typescript
// src/services/connection-pool.ts
import { supabase } from './supabase'

// Maximum number of concurrent requests
const MAX_CONCURRENT_REQUESTS = 5

// Queue for pending requests
const requestQueue: (() => void)[] = []

// Current number of active requests
let activeRequests = 0

export const connectionPool = {
  // Execute a request with connection pooling
  async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // If we can execute the request immediately
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      return this.executeRequestImmediately(requestFn)
    }

    // Otherwise, queue the request
    return new Promise<T>((resolve, reject) => {
      requestQueue.push(() => {
        this.executeRequestImmediately(requestFn).then(resolve).catch(reject)
      })
    })
  },

  // Execute a request immediately
  async executeRequestImmediately<T>(requestFn: () => Promise<T>): Promise<T> {
    activeRequests++

    try {
      return await requestFn()
    } finally {
      activeRequests--

      // Process next request in queue if any
      if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
        const nextRequest = requestQueue.shift()
        nextRequest?.()
      }
    }
  },
}
```

## 9. Migration Strategy

Create migration scripts for future schema changes:

```typescript
// scripts/migrations/20250401_add_recipe_description.ts
import { supabase } from '../../src/services/supabase'

const runMigration = async () => {
  console.log('Running migration: Add recipe description')

  // Add column to recipes table
  const { error: columnError } = await supabase.rpc('add_column_if_not_exists', {
    table_name: 'recipes',
    column_name: 'description',
    column_type: 'text',
  })

  if (columnError) {
    console.error('Error adding column:', columnError)
    return
  }

  // Update RLS policies
  const { error: policyError } = await supabase.rpc('update_policy', {
    policy_name: 'Users can update their own recipes',
    table_name: 'recipes',
    using_expression: 'auth.uid() = created_by',
  })

  if (policyError) {
    console.error('Error updating policy:', policyError)
    return
  }

  console.log('Migration completed successfully')
}

runMigration()
```

Create a migration runner:

```typescript
// scripts/run-migrations.ts
import fs from 'fs'
import path from 'path'
import { supabase } from '../src/services/supabase'

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')
const MIGRATIONS_TABLE = 'migrations'

// Ensure migrations table exists
const ensureMigrationsTable = async () => {
  const { error } = await supabase.rpc('create_table_if_not_exists', {
    table_name: MIGRATIONS_TABLE,
    columns: 'id serial primary key, name text unique, executed_at timestamptz default now()',
  })

  if (error) {
    console.error('Error creating migrations table:', error)
    process.exit(1)
  }
}

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const { data, error } = await supabase.from(MIGRATIONS_TABLE).select('name')

  if (error) {
    console.error('Error fetching executed migrations:', error)
    process.exit(1)
  }

  return data?.map((m) => m.name) || []
}

// Run pending migrations
const runPendingMigrations = async (executedMigrations: string[]) => {
  // Get all migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
    .sort()

  // Filter out already executed migrations
  const pendingMigrations = files.filter((file) => !executedMigrations.includes(file))

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations')
    return
  }

  console.log(`Found ${pendingMigrations.length} pending migrations`)

  // Run each pending migration
  for (const migration of pendingMigrations) {
    console.log(`Running migration: ${migration}`)

    try {
      // Import and run migration
      const migrationModule = require(path.join(MIGRATIONS_DIR, migration))
      await migrationModule.default()

      // Record migration as executed
      await supabase.from(MIGRATIONS_TABLE).insert({ name: migration })

      console.log(`Migration ${migration} completed successfully`)
    } catch (error) {
      console.error(`Error running migration ${migration}:`, error)
      process.exit(1)
    }
  }
}

// Main function
const main = async () => {
  await ensureMigrationsTable()
  const executedMigrations = await getExecutedMigrations()
  await runPendingMigrations(executedMigrations)
  console.log('All migrations completed successfully')
}

main()
```

## 10. Documentation and Examples

Create comprehensive documentation for the Supabase integration:

````markdown
# Supabase Integration Documentation

This document provides comprehensive documentation for the Supabase integration in the Bakers Dozen application.

## Authentication

### Signing Up

```typescript
import { auth } from '../services/auth'

const signUp = async (email: string, password: string) => {
  const { user, error } = await auth.signUp({ email, password })

  if (error) {
    console.error('Error signing up:', error)
    return
  }

  console.log('User signed up:', user)
}
```
````

### Signing In

```typescript
import { auth } from '../services/auth'

const signIn = async (email: string, password: string) => {
  const { user, error } = await auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Error signing in:', error)
    return
  }

  console.log('User signed in:', user)
}
```

### Signing Out

```typescript
import { auth } from '../services/auth'

const signOut = async () => {
  const { error } = await auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    return
  }

  console.log('User signed out')
}
```

## Database Operations

### Fetching Data

```typescript
import { db } from '../services/database'

const getIngredients = async () => {
  const ingredients = await db.getAll('ingredients')
  console.log('Ingredients:', ingredients)
}

const getIngredientById = async (id: string) => {
  const ingredient = await db.getById('ingredients', id)
  console.log('Ingredient:', ingredient)
}

const getIngredientsWithLowStock = async () => {
  const ingredients = await db.query(
    'ingredients',
    (ingredient) => ingredient.current_quantity <= ingredient.min_quantity,
  )
  console.log('Low stock ingredients:', ingredients)
}
```

### Creating Data

```typescript
import { db } from '../services/database'

const createIngredient = async (name: string, quantity: number, unit: string) => {
  const ingredient = await db.insert('ingredients', {
    name,
    current_quantity: quantity,
    min_quantity: quantity * 0.2, // 20% of current quantity
    unit,
    last_updated: new Date().toISOString(),
  })

  console.log('Ingredient created:', ingredient)
}
```

### Updating Data

```typescript
import { db } from '../services/database'

const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
  const ingredient = await db.update('ingredients', {
    id,
    ...updates,
    last_updated: new Date().toISOString(),
  })

  console.log('Ingredient updated:', ingredient)
}
```

### Deleting Data

```typescript
import { db } from '../services/database'

const deleteIngredient = async (id: string) => {
  const success = await db.delete('ingredients', id)

  if (success) {
    console.log('Ingredient deleted')
  } else {
    console.error('Failed to delete ingredient')
  }
}
```

## Real-time Subscriptions

```typescript
import { realtime } from '../services/realtime'

const subscribeToIngredients = () => {
  const unsubscribe = realtime.subscribe('ingredients', '*', (payload) => {
    if (payload.eventType === 'INSERT') {
      console.log('Ingredient added:', payload.new)
    } else if (payload.eventType === 'UPDATE') {
      console.log('Ingredient updated:', payload.new)
    } else if (payload.eventType === 'DELETE') {
      console.log('Ingredient deleted:', payload.old)
    }
  })

  // Later, to unsubscribe
  unsubscribe()
}
```

## Error Handling

```typescript
import { errorHandler, ErrorType, ErrorSeverity } from '../services/error-handler'

try {
  // Some operation that might fail
} catch (error) {
  errorHandler.handleError(error, ErrorType.DATABASE, ErrorSeverity.ERROR)
}
```

## Security

```typescript
import { security } from '../services/security'

const canEditRecipe = (recipeId: string, createdBy: string) => {
  const canEdit = security.canPerformAction('update', 'recipes', createdBy)

  if (canEdit) {
    console.log('User can edit this recipe')
  } else {
    console.log('User cannot edit this recipe')
  }
}
```

```

## 11. Implementation Timeline

### Phase 1: Setup and Authentication (Week 1)

1. Set up Supabase project
2. Configure environment variables
3. Implement Supabase client initialization
4. Create authentication service
5. Update auth store to use Supabase auth
6. Test authentication flows

### Phase 2: Database Schema and CRUD Operations (Week 2)

1. Create database schema in Supabase
2. Generate TypeScript types
3. Implement database service
4. Update components to use new database service
5. Test CRUD operations

### Phase 3: Security and Real-time Features (Week 3)

1. Implement Row-Level Security policies
2. Create security service
3. Implement real-time subscription service
4. Update components to use real-time features
5. Test security and real-time functionality

### Phase 4: Error Handling and Caching (Week 4)

1. Implement error handling service
2. Create error boundaries
3. Implement caching service
4. Implement connection pooling
5. Test error handling and caching

### Phase 5: Migration and Documentation (Week 5)

1. Create migration scripts
2. Implement migration runner
3. Create comprehensive documentation
4. Perform final testing
5. Deploy to production
```
