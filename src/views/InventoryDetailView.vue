<template>
  <div>
    <v-btn
      text
      to="/inventory"
      class="mb-4"
    >
      <v-icon left>mdi-arrow-left</v-icon>
      Back to Inventory
    </v-btn>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    
    <div v-else-if="!ingredient">
      <v-alert type="error">
        Ingredient not found
      </v-alert>
    </div>
    
    <div v-else>
      <v-row>
        <v-col cols="12" md="8">
          <h1 class="text-h4 mb-4">{{ ingredient.name }}</h1>
        </v-col>
        <v-col cols="12" md="4" class="d-flex justify-end align-center">
          <v-chip
            :color="getQuantityColor(ingredient.current_quantity, ingredient.min_quantity)"
            text-color="white"
            large
          >
            {{ ingredient.current_quantity }} {{ ingredient.unit }}
          </v-chip>
        </v-col>
      </v-row>
      
      <!-- Ingredient Details -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-information</v-icon>
          Ingredient Details
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-scale</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Current Quantity</v-list-item-title>
                    <v-list-item-subtitle>{{ ingredient.current_quantity }} {{ ingredient.unit }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-alert-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Minimum Quantity</v-list-item-title>
                    <v-list-item-subtitle>{{ ingredient.min_quantity }} {{ ingredient.unit }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-update</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Last Updated</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(ingredient.last_updated) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-identifier</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>ID</v-list-item-title>
                    <v-list-item-subtitle>{{ ingredient.id }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-2">Stock Level</h3>
              <v-progress-linear
                :value="stockPercentage"
                :color="getQuantityColor(ingredient.current_quantity, ingredient.min_quantity)"
                height="25"
                striped
              >
                <template v-slot:default>
                  <strong>{{ stockPercentage.toFixed(1) }}%</strong>
                </template>
              </v-progress-linear>
              
              <div class="mt-2 text-body-1" v-if="isLowStock">
                <v-icon color="warning" left>mdi-alert</v-icon>
                Low stock level. Consider ordering more.
              </div>
              <div class="mt-2 text-body-1" v-if="isOutOfStock">
                <v-icon color="error" left>mdi-alert-circle</v-icon>
                Out of stock. Order immediately.
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            to="/deliveries/new"
          >
            <v-icon left>mdi-truck-delivery</v-icon>
            Add to Delivery
          </v-btn>
        </v-card-actions>
      </v-card>
      
      <!-- Inventory Movement History -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-history</v-icon>
          Inventory Movement History
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :headers="movementHeaders"
            :items="movements"
            :loading="loadingMovements"
            :items-per-page="5"
            class="elevation-1"
            :sort-by="[{ key: 'date', order: 'desc' }]"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            
            <template v-slot:item.type="{ item }">
              <v-chip
                :color="getMovementTypeColor(item.type)"
                text-color="white"
                small
              >
                {{ item.type }}
              </v-chip>
            </template>
            
            <template v-slot:item.quantity="{ item }">
              <span :class="item.type === 'delivery' ? 'success--text' : 'error--text'">
                {{ item.type === 'delivery' ? '+' : '-' }}{{ item.quantity }} {{ ingredient.unit }}
              </span>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
      
      <!-- Recipes Using This Ingredient -->
      <v-card>
        <v-card-title>
          <v-icon left>mdi-book-open-variant</v-icon>
          Recipes Using This Ingredient
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :headers="recipeHeaders"
            :items="recipes"
            :loading="loadingRecipes"
            :items-per-page="5"
            class="elevation-1"
            :sort-by="[{ key: 'name' }]"
          >
            <template v-slot:item.quantity="{ item }">
              {{ item.quantity }} {{ ingredient.unit }}
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                small
                color="primary"
                :to="`/recipes/${item.id}`"
                title="View Recipe"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { db } from '../services/database'

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

interface Recipe {
  id: string
  name: string
  expected_yield: number
  created_by: string
  created_at: string
}

interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
}

interface Delivery {
  id: string
  supplier: string
  delivery_date: string
  created_by: string
  created_at: string
}

interface DeliveryItem {
  id: string
  delivery_id: string
  ingredient_id: string
  quantity: number
  batch_number: string
  expiry_date: string
}

interface Removal {
  id: string
  reason: string
  removal_date: string
  created_by: string
  created_at: string
}

interface RemovalItem {
  id: string
  removal_id: string
  ingredient_id: string
  quantity: number
}

interface Bake {
  id: string
  recipe_id: string
  actual_yield: number
  bake_date: string
  notes?: string
  created_by: string
  created_at: string
}

export default defineComponent({
  name: 'InventoryDetailView',
  
  setup() {
    const route = useRoute()
    const ingredientId = route.params.id as string
    
    const loading = ref(true)
    const ingredient = ref<Ingredient | null>(null)
    
    const loadingMovements = ref(true)
    const movements = ref<any[]>([])
    
    const loadingRecipes = ref(true)
    const recipes = ref<any[]>([])
    
    const movementHeaders = [
      { text: 'Date', value: 'date' },
      { text: 'Type', value: 'type' },
      { text: 'Quantity', value: 'quantity' },
      { text: 'Reference', value: 'reference' }
    ]
    
    const recipeHeaders = [
      { text: 'Recipe Name', value: 'name' },
      { text: 'Quantity Used', value: 'quantity' },
      { text: 'Expected Yield', value: 'expected_yield' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    // Calculate if the ingredient is low on stock
    const isLowStock = computed(() => {
      if (!ingredient.value) return false
      return (
        ingredient.value.current_quantity > 0 &&
        ingredient.value.current_quantity <= ingredient.value.min_quantity
      )
    })
    
    // Calculate if the ingredient is out of stock
    const isOutOfStock = computed(() => {
      if (!ingredient.value) return false
      return ingredient.value.current_quantity <= 0
    })
    
    // Calculate stock percentage for progress bar
    const stockPercentage = computed(() => {
      if (!ingredient.value || ingredient.value.min_quantity === 0) return 0
      
      // Calculate percentage relative to minimum quantity (200% means twice the minimum)
      const percentage = (ingredient.value.current_quantity / ingredient.value.min_quantity) * 100
      
      // Cap at 100% for the progress bar
      return Math.min(percentage, 100)
    })
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }
    
    // Get color based on quantity level
    const getQuantityColor = (current: number, min: number) => {
      if (current <= 0) return 'error'
      if (current <= min) return 'warning'
      return 'success'
    }
    
    // Get color for movement type
    const getMovementTypeColor = (type: string) => {
      switch (type) {
        case 'delivery':
          return 'success'
        case 'removal':
          return 'error'
        case 'bake':
          return 'info'
        default:
          return 'grey'
      }
    }
    
    // Fetch ingredient details
    const fetchIngredient = async () => {
      loading.value = true
      
      try {
        const ingredientData = await db.getById<'ingredients'>('ingredients', ingredientId)
        
        if (ingredientData) {
          ingredient.value = ingredientData
        }
      } catch (error) {
        console.error('Error fetching ingredient:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Fetch ingredient movements
    const fetchMovements = async () => {
      loadingMovements.value = true
      
      try {
        // Fetch deliveries
        const deliveryItems = await db.query<'delivery_items'>('delivery_items', 
          item => item.ingredient_id === ingredientId
        )
        
        const deliveries = await db.getAll<'deliveries'>('deliveries')
        
        // Fetch removals
        const removalItems = await db.query<'removal_items'>('removal_items', 
          item => item.ingredient_id === ingredientId
        )
        
        const removals = await db.getAll<'removals'>('removals')
        
        // Fetch bakes
        const recipeIngredients = await db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.ingredient_id === ingredientId
        )
        
        const recipes = await db.getAll<'recipes'>('recipes')
        const bakes = await db.getAll<'bakes'>('bakes')
        
        // Transform deliveries
        const deliveryMovements = deliveryItems.map(item => {
          const delivery = deliveries.find(d => d.id === item.delivery_id)
          return {
            id: `delivery-${item.id}`,
            date: delivery?.delivery_date || new Date().toISOString(),
            type: 'delivery',
            quantity: item.quantity,
            reference: `Supplier: ${delivery?.supplier || 'Unknown'}, Batch: ${item.batch_number}`
          }
        })
        
        // Transform removals
        const removalMovements = removalItems.map(item => {
          const removal = removals.find(r => r.id === item.removal_id)
          return {
            id: `removal-${item.id}`,
            date: removal?.removal_date || new Date().toISOString(),
            type: 'removal',
            quantity: item.quantity,
            reference: `Reason: ${removal?.reason || 'Unknown'}`
          }
        })
        
        // Transform bakes
        const bakeMovements: any[] = []
        
        recipeIngredients.forEach(item => {
          const recipe = recipes.find(r => r.id === item.recipe_id)
          
          if (recipe) {
            const recipeBakes = bakes.filter(b => b.recipe_id === recipe.id)
            
            recipeBakes.forEach(bake => {
              bakeMovements.push({
                id: `bake-${bake.id}`,
                date: bake.bake_date,
                type: 'bake',
                quantity: item.quantity,
                reference: `Recipe: ${recipe.name}`
              })
            })
          }
        })
        
        // Combine all data and sort by date
        movements.value = [...deliveryMovements, ...removalMovements, ...bakeMovements]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      } catch (error) {
        console.error('Error fetching movements:', error)
      } finally {
        loadingMovements.value = false
      }
    }
    
    // Fetch recipes using this ingredient
    const fetchRecipes = async () => {
      loadingRecipes.value = true
      
      try {
        const recipeIngredients = await db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.ingredient_id === ingredientId
        )
        
        const recipesData = await db.getAll<'recipes'>('recipes')
        
        // Transform data
        recipes.value = recipeIngredients.map(item => {
          const recipe = recipesData.find(r => r.id === item.recipe_id)
          
          if (!recipe) {
            return {
              id: item.recipe_id,
              name: 'Unknown Recipe',
              quantity: item.quantity,
              expected_yield: 0
            }
          }
          
          return {
            id: recipe.id,
            name: recipe.name,
            quantity: item.quantity,
            expected_yield: recipe.expected_yield
          }
        })
      } catch (error) {
        console.error('Error fetching recipes:', error)
      } finally {
        loadingRecipes.value = false
      }
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'ingredients' && action === 'update' && (item as Ingredient).id === ingredientId) {
          fetchIngredient()
        } else if (['delivery_items', 'removal_items', 'bakes'].includes(table)) {
          fetchMovements()
        } else if (['recipe_ingredients', 'recipes'].includes(table)) {
          fetchRecipes()
        }
      })
    }
    
    onMounted(() => {
      fetchIngredient()
      fetchMovements()
      fetchRecipes()
      setupSubscription()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      loading,
      ingredient,
      loadingMovements,
      movements,
      loadingRecipes,
      recipes,
      movementHeaders,
      recipeHeaders,
      isLowStock,
      isOutOfStock,
      stockPercentage,
      formatDate,
      getQuantityColor,
      getMovementTypeColor
    }
  }
})
</script>