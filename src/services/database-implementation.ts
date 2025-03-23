// Sample database service implementation
// This file shows how to implement the database service using either SQL Server or Supabase

// =====================================================================
// OPTION 1: SQL Server Implementation
// =====================================================================

import sql from 'mssql'; // You'll need to install this: npm install mssql

// Define table names and their record types (same as in the localStorage version)
export interface Tables {
  'users': User;
  'ingredients': Ingredient;
  'recipes': Recipe;
  'recipe_ingredients': RecipeIngredient;
  'bakes': Bake;
  'deliveries': Delivery;
  'delivery_items': DeliveryItem;
  'removals': Removal;
  'removal_items': RemovalItem;
}

// Define record types (same as in the localStorage version)
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  unit: string;
  last_updated: string;
}

export interface Recipe {
  id: string;
  name: string;
  expected_yield: number;
  created_by: string;
  created_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
}

export interface Bake {
  id: string;
  recipe_id: string;
  actual_yield: number;
  bake_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  supplier: string;
  delivery_date: string;
  created_by: string;
  created_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  ingredient_id: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
}

export interface Removal {
  id: string;
  reason: string;
  removal_date: string;
  created_by: string;
  created_at: string;
}

export interface RemovalItem {
  id: string;
  removal_id: string;
  ingredient_id: string;
  quantity: number;
}

// Define action types for subscription
export type Action = 'insert' | 'update' | 'delete';

// Define subscription callback type
export type SubscriptionCallback = (table: keyof Tables, action: Action, item: any) => void;

// SQL Server configuration
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'BakersDozen',
  options: {
    trustServerCertificate: true // For development only
  }
};

// Subscription handlers
let nextSubscriptionId = 1;
const subscriptions: Record<number, SubscriptionCallback> = {};

// SQL Server database service
export const sqlServerDb = {
  // Connect to the database
  async connect() {
    try {
      await sql.connect(config);
      console.log('Connected to SQL Server database');
    } catch (err) {
      console.error('Database connection error:', err);
      throw err;
    }
  },

  // Get all records from a table
  async getAll<T extends keyof Tables>(table: T): Promise<Tables[T][]> {
    try {
      const result = await sql.query(`SELECT * FROM ${table}`);
      return result.recordset;
    } catch (err) {
      console.error(`Error fetching all records from ${table}:`, err);
      return [];
    }
  },

  // Get a record by ID
  async getById<T extends keyof Tables>(table: T, id: string): Promise<Tables[T] | null> {
    try {
      const result = await sql.query`SELECT * FROM ${sql.raw(table)} WHERE id = ${id}`;
      return result.recordset[0] || null;
    } catch (err) {
      console.error(`Error fetching record by ID from ${table}:`, err);
      return null;
    }
  },

  // Query records
  async query<T extends keyof Tables>(table: T, whereClause: string, params: any[] = []): Promise<Tables[T][]> {
    try {
      const request = new sql.Request();
      
      // Add parameters
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(`SELECT * FROM ${table} WHERE ${whereClause}`);
      return result.recordset;
    } catch (err) {
      console.error(`Error querying records from ${table}:`, err);
      return [];
    }
  },

  // Insert a record
  async insert<T extends keyof Tables>(table: T, record: Partial<Tables[T]>): Promise<Tables[T]> {
    try {
      // Generate a new ID if not provided
      const newRecord = {
        ...record,
        id: record.id || this.generateId()
      };
      
      // Create column and value lists
      const columns = Object.keys(newRecord).join(', ');
      const valueParams = Object.keys(newRecord).map((_, i) => `@param${i}`).join(', ');
      
      const request = new sql.Request();
      
      // Add parameters
      Object.values(newRecord).forEach((value, index) => {
        request.input(`param${index}`, value);
      });
      
      // Insert the record
      await request.query(`INSERT INTO ${table} (${columns}) VALUES (${valueParams})`);
      
      // Get the inserted record
      const result = await this.getById(table, newRecord.id as string);
      
      // Notify subscribers
      this.notifySubscribers(table, 'insert', result);
      
      return result as Tables[T];
    } catch (err) {
      console.error(`Error inserting record into ${table}:`, err);
      throw err;
    }
  },

  // Update a record
  async update<T extends keyof Tables>(table: T, record: Partial<Tables[T]> & { id: string }): Promise<Tables[T] | null> {
    try {
      // Create SET clause
      const setClause = Object.keys(record)
        .filter(key => key !== 'id')
        .map((key, i) => `${key} = @param${i}`)
        .join(', ');
      
      const request = new sql.Request();
      
      // Add parameters for SET clause
      Object.entries(record)
        .filter(([key]) => key !== 'id')
        .forEach(([_, value], index) => {
          request.input(`param${index}`, value);
        });
      
      // Add ID parameter
      request.input('id', record.id);
      
      // Update the record
      await request.query(`UPDATE ${table} SET ${setClause} WHERE id = @id`);
      
      // Get the updated record
      const updatedRecord = await this.getById(table, record.id);
      
      // Notify subscribers
      if (updatedRecord) {
        this.notifySubscribers(table, 'update', updatedRecord);
      }
      
      return updatedRecord;
    } catch (err) {
      console.error(`Error updating record in ${table}:`, err);
      return null;
    }
  },

  // Delete a record
  async delete<T extends keyof Tables>(table: T, id: string): Promise<boolean> {
    try {
      // Get the record before deleting it
      const record = await this.getById(table, id);
      
      if (!record) return false;
      
      // Delete the record
      await sql.query`DELETE FROM ${sql.raw(table)} WHERE id = ${id}`;
      
      // Notify subscribers
      this.notifySubscribers(table, 'delete', record);
      
      return true;
    } catch (err) {
      console.error(`Error deleting record from ${table}:`, err);
      return false;
    }
  },

  // Subscribe to changes
  subscribe(callback: SubscriptionCallback): () => void {
    const id = nextSubscriptionId++;
    subscriptions[id] = callback;
    
    // Return unsubscribe function
    return () => {
      delete subscriptions[id];
    };
  },

  // Notify subscribers of changes
  notifySubscribers<T extends keyof Tables>(table: T, action: Action, record: Tables[T]): void {
    Object.values(subscriptions).forEach(callback => {
      callback(table, action, record);
    });
  },

  // Generate a random UUID
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// =====================================================================
// OPTION 2: Supabase Implementation
// =====================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase database service
export const supabaseDb = {
  // Get all records from a table
  async getAll<T extends keyof Tables>(table: T): Promise<Tables[T][]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error(`Error fetching all records from ${table}:`, err);
      return [];
    }
  },

  // Get a record by ID
  async getById<T extends keyof Tables>(table: T, id: string): Promise<Tables[T] | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error(`Error fetching record by ID from ${table}:`, err);
      return null;
    }
  },

  // Query records with a filter function
  async query<T extends keyof Tables>(table: T, filterFn: (record: Tables[T]) => boolean): Promise<Tables[T][]> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) throw error;
      
      // Apply filter function in memory
      return (data || []).filter(filterFn);
    } catch (err) {
      console.error(`Error querying records from ${table}:`, err);
      return [];
    }
  },

  // Insert a record
  async insert<T extends keyof Tables>(table: T, record: Partial<Tables[T]>): Promise<Tables[T]> {
    try {
      // Generate a new ID if not provided
      const newRecord = {
        ...record,
        id: record.id || this.generateId()
      };
      
      const { data, error } = await supabase
        .from(table)
        .insert(newRecord)
        .select()
        .single();
      
      if (error) throw error;
      
      // Notify subscribers (using Supabase realtime, this might be redundant)
      this.notifySubscribers(table, 'insert', data);
      
      return data;
    } catch (err) {
      console.error(`Error inserting record into ${table}:`, err);
      throw err;
    }
  },

  // Update a record
  async update<T extends keyof Tables>(table: T, record: Partial<Tables[T]> & { id: string }): Promise<Tables[T] | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(record)
        .eq('id', record.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Notify subscribers (using Supabase realtime, this might be redundant)
      this.notifySubscribers(table, 'update', data);
      
      return data;
    } catch (err) {
      console.error(`Error updating record in ${table}:`, err);
      return null;
    }
  },

  // Delete a record
  async delete<T extends keyof Tables>(table: T, id: string): Promise<boolean> {
    try {
      // Get the record before deleting it
      const record = await this.getById(table, id);
      
      if (!record) return false;
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify subscribers (using Supabase realtime, this might be redundant)
      this.notifySubscribers(table, 'delete', record);
      
      return true;
    } catch (err) {
      console.error(`Error deleting record from ${table}:`, err);
      return false;
    }
  },

  // Subscribe to changes using Supabase realtime
  subscribe(callback: SubscriptionCallback): () => void {
    const channels: any[] = [];
    
    // Subscribe to each table
    Object.keys(Tables).forEach((table) => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          // Map Supabase events to our action types
          let action: Action;
          switch (payload.eventType) {
            case 'INSERT':
              action = 'insert';
              callback(table as keyof Tables, action, payload.new);
              break;
            case 'UPDATE':
              action = 'update';
              callback(table as keyof Tables, action, payload.new);
              break;
            case 'DELETE':
              action = 'delete';
              callback(table as keyof Tables, action, payload.old);
              break;
          }
        })
        .subscribe();
      
      channels.push(channel);
    });
    
    // Return unsubscribe function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  },

  // Notify subscribers of changes (for manual notifications)
  notifySubscribers<T extends keyof Tables>(table: T, action: Action, record: Tables[T]): void {
    Object.values(subscriptions).forEach(callback => {
      callback(table, action, record);
    });
  },

  // Generate a random UUID
  generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// Export a unified database interface that can be switched between implementations
export const db = process.env.DB_TYPE === 'supabase' ? supabaseDb : sqlServerDb;
