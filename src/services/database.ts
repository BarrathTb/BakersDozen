import { supabase } from './supabase'
import { getConnectionStatus } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Tables, TableName, User, Ingredient, Recipe, RecipeIngredient, 
  Bake, Delivery, DeliveryItem, Removal, RemovalItem,
  Views, ViewName, InventoryStatus, RecipeDetails, BakeEfficiency
} from '../types/supabase'

// Define action types for subscription
export type Action = 'insert' | 'update' | 'delete'

// Define subscription callback type
export type SubscriptionCallback = (table: TableName, action: Action, item: any) => void

// Subscription handlers
let nextSubscriptionId = 1
const subscriptions: Record<number, SubscriptionCallback> = {}

// Database service
export const db = {
  // Get all records from a table
  async getAll<T extends TableName>(table: T): Promise<Tables[T]['Row'][]> {
    try {
      console.log(`Fetching all records from ${table}...`)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        console.log(`Offline mode: returning cached data for ${table}`)
        // Return cached data if available
        const cachedData = localStorage.getItem(`bakersDozen_${table}`)
        if (cachedData) {
          return JSON.parse(cachedData)
        }
        return []
      }
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
      
      if (error) {
        console.error(`Error fetching all records from ${table}:`, error)
        throw error
      }
      
      console.log(`Successfully fetched ${data?.length || 0} records from ${table}`)
      
      // Cache the data
      localStorage.setItem(`bakersDozen_${table}`, JSON.stringify(data))
      
      return data as Tables[T]['Row'][]
    } catch (error) {
      console.error(`Error fetching all records from ${table}:`, error)
      
      // Return cached data if available
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        console.log(`Returning ${parsedData.length} cached records for ${table}`)
        return parsedData
      }
      
      console.log(`No cached data available for ${table}, returning empty array`)
      return []
    }
  },

  // Get a record by ID
  async getById<T extends TableName>(table: T, id: string): Promise<Tables[T]['Row'] | null> {
    try {
      console.log(`Fetching record with ID ${id} from ${table}...`)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        console.log(`Offline mode: looking for cached record with ID ${id} in ${table}`)
        // Try to find in cached data
        const cachedData = localStorage.getItem(`bakersDozen_${table}`)
        if (cachedData) {
          const items = JSON.parse(cachedData)
          const item = items.find((item: any) => item.id === id)
          if (item) {
            console.log(`Found cached record with ID ${id} in ${table}`)
          } else {
            console.log(`No cached record found with ID ${id} in ${table}`)
          }
          return item || null
        }
        return null
      }
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No record found with ID ${id} in ${table}`)
          return null
        }
        console.error(`Error fetching record by ID from ${table}:`, error)
        throw error
      }
      
      console.log(`Successfully fetched record with ID ${id} from ${table}`)
      return data as Tables[T]['Row']
    } catch (error) {
      console.error(`Error fetching record by ID from ${table}:`, error)
      
      // Try to find in cached data
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        const items = JSON.parse(cachedData)
        return items.find((item: any) => item.id === id) || null
      }
      
      return null
    }
  },

  // Query records with a filter function
  async query<T extends TableName>(table: T, filterFn: (record: Tables[T]['Row']) => boolean): Promise<Tables[T]['Row'][]> {
    try {
      console.log(`Querying records from ${table} with filter function...`)
      const allRecords = await this.getAll(table)
      const filteredRecords = allRecords.filter(filterFn)
      console.log(`Query returned ${filteredRecords.length} records from ${table}`)
      return filteredRecords
    } catch (error) {
      console.error(`Error querying records from ${table}:`, error)
      return []
    }
  },

  // Insert a record
  async insert<T extends TableName>(table: T, record: Partial<Tables[T]['Row']>): Promise<Tables[T]['Row']> {
    try {
      console.log(`Inserting record into ${table}...`, record)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        throw new Error('Cannot insert records while offline')
      }
      
      // Generate a new ID if not provided
      const newRecord = {
        ...record,
        id: record.id || uuidv4()
      }
      
      const { data, error } = await supabase
        .from(table)
        .insert(newRecord)
        .select()
        .single()
      
      if (error) {
        console.error(`Error inserting record into ${table}:`, error)
        throw error
      }
      
      console.log(`Successfully inserted record into ${table} with ID ${data.id}`)
      
      // Update cache
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        const items = JSON.parse(cachedData)
        items.push(data)
        localStorage.setItem(`bakersDozen_${table}`, JSON.stringify(items))
      }
      
      // Notify subscribers
      this.notifySubscribers(table, 'insert', data)
      
      return data as Tables[T]['Row']
    } catch (error) {
      console.error(`Error inserting record into ${table}:`, error)
      throw error
    }
  },

  // Update a record
  async update<T extends TableName>(table: T, record: Partial<Tables[T]['Row']> & { id: string }): Promise<Tables[T]['Row'] | null> {
    try {
      console.log(`Updating record in ${table} with ID ${record.id}...`)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        throw new Error('Cannot update records while offline')
      }
      
      const { data, error } = await supabase
        .from(table)
        .update(record)
        .eq('id', record.id)
        .select()
        .single()
      
      if (error) {
        console.error(`Error updating record in ${table}:`, error)
        throw error
      }
      
      console.log(`Successfully updated record in ${table} with ID ${record.id}`)
      
      // Update cache
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        const items = JSON.parse(cachedData)
        const index = items.findIndex((item: any) => item.id === record.id)
        if (index !== -1) {
          items[index] = { ...items[index], ...record }
          localStorage.setItem(`bakersDozen_${table}`, JSON.stringify(items))
        }
      }
      
      // Notify subscribers
      this.notifySubscribers(table, 'update', data)
      
      return data as Tables[T]['Row']
    } catch (error) {
      console.error(`Error updating record in ${table}:`, error)
      return null
    }
  },

  // Delete a record
  async delete<T extends TableName>(table: T, id: string): Promise<boolean> {
    try {
      console.log(`Deleting record from ${table} with ID ${id}...`)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        throw new Error('Cannot delete records while offline')
      }
      
      // Get the record before deleting it
      const record = await this.getById(table, id)
      
      if (!record) {
        console.log(`No record found with ID ${id} in ${table}, nothing to delete`)
        return false
      }
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error(`Error deleting record from ${table}:`, error)
        throw error
      }
      
      console.log(`Successfully deleted record from ${table} with ID ${id}`)
      
      // Update cache
      const cachedData = localStorage.getItem(`bakersDozen_${table}`)
      if (cachedData) {
        const items = JSON.parse(cachedData)
        const filteredItems = items.filter((item: any) => item.id !== id)
        localStorage.setItem(`bakersDozen_${table}`, JSON.stringify(filteredItems))
      }
      
      // Notify subscribers
      this.notifySubscribers(table, 'delete', record)
      
      return true
    } catch (error) {
      console.error(`Error deleting record from ${table}:`, error)
      return false
    }
  },

  // Get data from a view
  async getView<T extends ViewName>(view: T): Promise<Views[T]['Row'][]> {
    try {
      console.log(`Fetching data from view ${view}...`)
      
      // Check if we're offline
      if (!getConnectionStatus()) {
        console.log(`Offline mode: returning cached data for view ${view}`)
        // Return cached data if available
        const cachedData = localStorage.getItem(`bakersDozen_view_${view}`)
        if (cachedData) {
          return JSON.parse(cachedData)
        }
        return []
      }
      
      const { data, error } = await supabase
        .from(view)
        .select('*')
      
      if (error) {
        console.error(`Error fetching data from view ${view}:`, error)
        throw error
      }
      
      console.log(`Successfully fetched ${data?.length || 0} records from view ${view}`)
      
      // Cache the data
      localStorage.setItem(`bakersDozen_view_${view}`, JSON.stringify(data))
      
      return data as Views[T]['Row'][]
    } catch (error) {
      console.error(`Error fetching data from view ${view}:`, error)
      
      // Return cached data if available
      const cachedData = localStorage.getItem(`bakersDozen_view_${view}`)
      if (cachedData) {
        return JSON.parse(cachedData)
      }
      
      return []
    }
  },

  // Subscribe to changes
  subscribe(callback: SubscriptionCallback): () => void {
    console.log('Setting up subscription to database changes...')
    const id = nextSubscriptionId++
    subscriptions[id] = callback
    
    // Set up Supabase realtime subscriptions
    const channels: any[] = []
    
    // Subscribe to each table
    const tables: TableName[] = [
      'users', 'ingredients', 'recipes', 'recipe_ingredients',
      'bakes', 'deliveries', 'delivery_items', 'removals', 'removal_items'
    ]
    
    tables.forEach(table => {
      console.log(`Setting up realtime subscription for table ${table}...`)
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          console.log(`Received realtime update for ${table}:`, payload)
          // Map Supabase events to our action types
          let action: Action;
          switch (payload.eventType) {
            case 'INSERT':
              action = 'insert';
              callback(table, action, payload.new);
              break;
            case 'UPDATE':
              action = 'update';
              callback(table, action, payload.new);
              break;
            case 'DELETE':
              action = 'delete';
              callback(table, action, payload.old);
              break;
          }
        })
        .subscribe()
      
      channels.push(channel)
    })
    
    console.log('Subscription setup complete')
    
    // Return unsubscribe function
    return () => {
      console.log('Removing subscription...')
      delete subscriptions[id]
      
      // Remove Supabase channels
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      console.log('Subscription removed')
    }
  },

  // Notify subscribers of changes
  notifySubscribers<T extends TableName>(table: T, action: Action, record: Tables[T]['Row']): void {
    console.log(`Notifying subscribers of ${action} on ${table}:`, record)
    Object.values(subscriptions).forEach(callback => {
      callback(table, action, record)
    })
  },

  // Generate a random UUID
  generateId(): string {
    return uuidv4()
  },
  
  // Clear cache for testing
  clearCache(): void {
    console.log('Clearing all cached data...')
    const tables: TableName[] = [
      'users', 'ingredients', 'recipes', 'recipe_ingredients',
      'bakes', 'deliveries', 'delivery_items', 'removals', 'removal_items'
    ]
    
    tables.forEach(table => {
      localStorage.removeItem(`bakersDozen_${table}`)
    })
    
    const views: ViewName[] = [
      'inventory_status', 'recipe_details', 'bake_efficiency'
    ]
    
    views.forEach(view => {
      localStorage.removeItem(`bakersDozen_view_${view}`)
    })
    
    console.log('Cache cleared')
  }
}

// Export types
export type {
  User, Ingredient, Recipe, RecipeIngredient, 
  Bake, Delivery, DeliveryItem, Removal, RemovalItem,
  InventoryStatus, RecipeDetails, BakeEfficiency
}