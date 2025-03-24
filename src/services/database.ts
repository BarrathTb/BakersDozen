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

// Cache management
const CACHE_VERSION = '1.0.0'
const CACHE_PREFIX = 'bakersDozen_'

// Helper function to get cache key with version
const getCacheKey = (key: string): string => {
  return `${CACHE_PREFIX}${key}_v${CACHE_VERSION}`
}

// Helper function to safely parse cached data
const safelyParseCachedData = (cacheKey: string): any | null => {
  try {
    const cachedData = localStorage.getItem(cacheKey)
    if (!cachedData) return null
    return JSON.parse(cachedData)
  } catch (error) {
    console.error(`Error parsing cached data for ${cacheKey}:`, error)
    // If there's an error parsing, remove the corrupted data
    localStorage.removeItem(cacheKey)
    return null
  }
}

// Helper function to safely store data in cache
const safelyStoreCachedData = (cacheKey: string, data: any): void => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data))
  } catch (error) {
    console.error(`Error storing data in cache for ${cacheKey}:`, error)
  }
}

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
        const cacheKey = getCacheKey(table)
        const parsedData = safelyParseCachedData(cacheKey)
        if (parsedData) {
          return parsedData
        }
        
        // Try legacy cache key as fallback
        const legacyData = safelyParseCachedData(`${CACHE_PREFIX}${table}`)
        if (legacyData) {
          return legacyData
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
      
      // Cache the data with versioned key
      const cacheKey = getCacheKey(table)
      safelyStoreCachedData(cacheKey, data)
      
      return data as Tables[T]['Row'][]
    } catch (error) {
      console.error(`Error fetching all records from ${table}:`, error)
      
      // Return cached data if available
      const cacheKey = getCacheKey(table)
      const parsedData = safelyParseCachedData(cacheKey)
      if (parsedData) {
        console.log(`Returning ${parsedData.length} cached records for ${table}`)
        return parsedData
      }
      
      // Try legacy cache key as fallback
      const legacyKey = `${CACHE_PREFIX}${table}`
      const legacyData = safelyParseCachedData(legacyKey)
      if (legacyData) {
        console.log(`Returning ${legacyData.length} legacy cached records for ${table}`)
        return legacyData
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
        const cacheKey = getCacheKey(table)
        const items = safelyParseCachedData(cacheKey)
        if (items) {
          const item = items.find((item: any) => item.id === id)
          if (item) {
            console.log(`Found cached record with ID ${id} in ${table}`)
          } else {
            console.log(`No cached record found with ID ${id} in ${table}`)
          }
          return item || null
        }
        
        // Try legacy cache
        const legacyKey = `${CACHE_PREFIX}${table}`
        const legacyItems = safelyParseCachedData(legacyKey)
        if (legacyItems) {
          return legacyItems.find((item: any) => item.id === id) || null
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
      const cacheKey = getCacheKey(table)
      const items = safelyParseCachedData(cacheKey)
      if (items) {
        return items.find((item: any) => item.id === id) || null
      }
      
      // Try legacy cache
      const legacyKey = `${CACHE_PREFIX}${table}`
      const legacyItems = safelyParseCachedData(legacyKey)
      if (legacyItems) {
        return legacyItems.find((item: any) => item.id === id) || null
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
      const cacheKey = getCacheKey(table)
      const items = safelyParseCachedData(cacheKey) || []
      items.push(data)
      safelyStoreCachedData(cacheKey, items)
      
      // Update legacy cache if it exists
      const legacyKey = `${CACHE_PREFIX}${table}`
      const legacyItems = safelyParseCachedData(legacyKey)
      if (legacyItems) {
        legacyItems.push(data)
        safelyStoreCachedData(legacyKey, legacyItems)
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
      const cacheKey = getCacheKey(table)
      const items = safelyParseCachedData(cacheKey)
      if (items) {
        const index = items.findIndex((item: any) => item.id === record.id)
        if (index !== -1) {
          items[index] = { ...items[index], ...data }
          safelyStoreCachedData(cacheKey, items)
        }
      }
      
      // Update legacy cache if it exists
      const legacyKey = `${CACHE_PREFIX}${table}`
      const legacyItems = safelyParseCachedData(legacyKey)
      if (legacyItems) {
        const index = legacyItems.findIndex((item: any) => item.id === record.id)
        if (index !== -1) {
          legacyItems[index] = { ...legacyItems[index], ...data }
          safelyStoreCachedData(legacyKey, legacyItems)
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
      const cacheKey = getCacheKey(table)
      const items = safelyParseCachedData(cacheKey)
      if (items) {
        const filteredItems = items.filter((item: any) => item.id !== id)
        safelyStoreCachedData(cacheKey, filteredItems)
      }
      
      // Update legacy cache if it exists
      const legacyKey = `${CACHE_PREFIX}${table}`
      const legacyItems = safelyParseCachedData(legacyKey)
      if (legacyItems) {
        const filteredItems = legacyItems.filter((item: any) => item.id !== id)
        safelyStoreCachedData(legacyKey, filteredItems)
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
        const cacheKey = getCacheKey(`view_${view}`)
        const parsedData = safelyParseCachedData(cacheKey)
        if (parsedData) {
          return parsedData
        }
        
        // Try legacy cache
        const legacyKey = `${CACHE_PREFIX}view_${view}`
        const legacyData = safelyParseCachedData(legacyKey)
        if (legacyData) {
          return legacyData
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
      const cacheKey = getCacheKey(`view_${view}`)
      safelyStoreCachedData(cacheKey, data)
      
      return data as Views[T]['Row'][]
    } catch (error) {
      console.error(`Error fetching data from view ${view}:`, error)
      
      // Return cached data if available
      const cacheKey = getCacheKey(`view_${view}`)
      const parsedData = safelyParseCachedData(cacheKey)
      if (parsedData) {
        return parsedData
      }
      
      // Try legacy cache
      const legacyKey = `${CACHE_PREFIX}view_${view}`
      const legacyData = safelyParseCachedData(legacyKey)
      if (legacyData) {
        return legacyData
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
  // generateId(): string {
  //   return uuidv4()
  // },
  
  // // Clear specific table cache
  // clearTableCache(table: TableName | ViewName): void {
  //   console.log(`Clearing cache for ${table}...`)
    
  //   // Clear both versioned and legacy cache keys
  //   localStorage.removeItem(`${CACHE_PREFIX}${table}`)
  //   localStorage.removeItem(getCacheKey(table))
  //   localStorage.removeItem(getCacheKey(`view_${table}`))
  //   localStorage.removeItem(`${CACHE_PREFIX}view_${table}`)
  // },
  
  // Clear cache for testing
  // clearCache(): void {
  //   console.log('Clearing all cached data...')
  //   const tables: TableName[] = [
  //     'users', 'ingredients', 'recipes', 'recipe_ingredients',
  //     'bakes', 'deliveries', 'delivery_items', 'removals', 'removal_items'
  //   ]
    
  //   tables.forEach(table => {
  //     this.clearTableCache(table)
  //   })
    
  //   const views: ViewName[] = [
  //     'inventory_status', 'recipe_details', 'bake_efficiency'
  //   ]
    
  //   views.forEach(view => {
  //     this.clearTableCache(view)
  //   })
    
  //   console.log('Cache cleared')
  // }
}

// Export types
export type {
  User, Ingredient, Recipe, RecipeIngredient, 
  Bake, Delivery, DeliveryItem, Removal, RemovalItem,
  InventoryStatus, RecipeDetails, BakeEfficiency
}