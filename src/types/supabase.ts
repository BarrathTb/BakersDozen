export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          current_quantity: number
          min_quantity: number
          unit: string
          last_updated: string
        }
        Insert: {
          id?: string
          name: string
          current_quantity: number
          min_quantity: number
          unit: string
          last_updated?: string
        }
        Update: {
          id?: string
          name?: string
          current_quantity?: number
          min_quantity?: number
          unit?: string
          last_updated?: string
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          expected_yield: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          expected_yield: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          expected_yield?: number
          created_by?: string
          created_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
        }
      }
      bakes: {
        Row: {
          id: string
          recipe_id: string
          actual_yield: number
          bake_date: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          actual_yield: number
          bake_date: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          actual_yield?: number
          bake_date?: string
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          supplier: string
          delivery_date: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          supplier: string
          delivery_date: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          supplier?: string
          delivery_date?: string
          created_by?: string
          created_at?: string
        }
      }
      delivery_items: {
        Row: {
          id: string
          delivery_id: string
          ingredient_id: string
          quantity: number
          batch_number: string
          expiry_date: string
        }
        Insert: {
          id?: string
          delivery_id: string
          ingredient_id: string
          quantity: number
          batch_number: string
          expiry_date: string
        }
        Update: {
          id?: string
          delivery_id?: string
          ingredient_id?: string
          quantity?: number
          batch_number?: string
          expiry_date?: string
        }
      }
      removals: {
        Row: {
          id: string
          reason: string
          removal_date: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          reason: string
          removal_date: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          reason?: string
          removal_date?: string
          created_by?: string
          created_at?: string
        }
      }
      removal_items: {
        Row: {
          id: string
          removal_id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          id?: string
          removal_id: string
          ingredient_id: string
          quantity: number
        }
        Update: {
          id?: string
          removal_id?: string
          ingredient_id?: string
          quantity?: number
        }
      }
    }
    Views: {
      inventory_status: {
        Row: {
          id: string
          name: string
          current_quantity: number
          min_quantity: number
          unit: string
          last_updated: string
          status: string
        }
      }
      recipe_details: {
        Row: {
          id: string
          name: string
          expected_yield: number
          created_by_email: string
          created_at: string
          ingredient_count: number
        }
      }
      bake_efficiency: {
        Row: {
          id: string
          bake_date: string
          recipe_name: string
          actual_yield: number
          expected_yield: number
          efficiency: number
          baker_email: string
          notes: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Export convenience types for each table
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

// Export row types for each table
export type User = Tables['users']['Row']
export type Ingredient = Tables['ingredients']['Row']
export type Recipe = Tables['recipes']['Row']
export type RecipeIngredient = Tables['recipe_ingredients']['Row']
export type Bake = Tables['bakes']['Row']
export type Delivery = Tables['deliveries']['Row']
export type DeliveryItem = Tables['delivery_items']['Row']
export type Removal = Tables['removals']['Row']
export type RemovalItem = Tables['removal_items']['Row']

// Export view types
export type Views = Database['public']['Views']
export type ViewName = keyof Views

export type InventoryStatus = Views['inventory_status']['Row']
export type RecipeDetails = Views['recipe_details']['Row']
export type BakeEfficiency = Views['bake_efficiency']['Row']