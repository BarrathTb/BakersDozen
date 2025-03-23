<template>
  <div>
    <h1 class="text-h4 mb-4">Bake Records</h1>
    
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between">
        <div>
          <v-icon left>mdi-bread-slice</v-icon>
          Bake History
        </div>
        <v-btn
          color="primary"
          to="/bakes/new"
        >
          <v-icon left>mdi-plus</v-icon>
          New Bake
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="bakes"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
          :sort-by="[{ key: 'bake_date', order: 'desc' }]"
        >
          <template v-slot:item.bake_date="{ item }">
            {{ formatDate(item.bake_date) }}
          </template>
          
          <template v-slot:item.efficiency="{ item }">
            <v-chip
              :color="getEfficiencyColor(item.efficiency)"
              text-color="white"
              small
            >
              {{ item.efficiency.toFixed(1) }}%
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              small
              color="primary"
              @click="viewDetails(item)"
              title="View Details"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Bake Details Dialog -->
    <v-dialog
      v-model="detailsDialog"
      max-width="800px"
    >
      <v-card v-if="selectedBake">
        <v-card-title>
          <v-icon left>mdi-bread-slice</v-icon>
          Bake Details: {{ selectedBake.recipe_name }}
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <strong>Date:</strong> {{ formatDate(selectedBake.bake_date) }}
            </v-col>
            <v-col cols="12" md="4">
              <strong>Baker:</strong> {{ selectedBake.created_by_email }}
            </v-col>
            <v-col cols="12" md="4">
              <strong>Efficiency:</strong> 
              <v-chip
                :color="getEfficiencyColor(selectedBake.efficiency)"
                text-color="white"
                small
                class="ml-2"
              >
                {{ selectedBake.efficiency.toFixed(1) }}%
              </v-chip>
            </v-col>
          </v-row>
          
          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <strong>Expected Yield:</strong> {{ selectedBake.expected_yield }}
            </v-col>
            <v-col cols="12" md="6">
              <strong>Actual Yield:</strong> {{ selectedBake.actual_yield }}
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-h6 mb-3">Ingredients Used</h3>
          
          <v-data-table
            :headers="ingredientHeaders"
            :items="bakeIngredients"
            :loading="loadingIngredients"
            hide-default-footer
            class="elevation-1"
          >
            <template v-slot:item.quantity="{ item }">
              {{ item.quantity }} {{ item.unit }}
            </template>
          </v-data-table>
          
          <v-card outlined class="mt-4" v-if="selectedBake.notes">
            <v-card-title>Notes</v-card-title>
            <v-card-text>
              {{ selectedBake.notes }}
            </v-card-text>
          </v-card>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="detailsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { db } from '../services/database'

interface Bake {
  id: string
  bake_date: string
  recipe_id: string
  actual_yield: number
  notes?: string
  created_by: string
  created_at: string
}

interface Recipe {
  id: string
  name: string
  expected_yield: number
  created_by: string
  created_at: string
}

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
}

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

export default defineComponent({
  name: 'BakesView',
  
  setup() {
    const loading = ref(true)
    const bakes = ref<any[]>([])
    const detailsDialog = ref(false)
    const selectedBake = ref<any>(null)
    const bakeIngredients = ref<any[]>([])
    const loadingIngredients = ref(false)
    
    const headers = [
      { text: 'Date', value: 'bake_date' },
      { text: 'Recipe', value: 'recipe_name' },
      { text: 'Expected Yield', value: 'expected_yield' },
      { text: 'Actual Yield', value: 'actual_yield' },
      { text: 'Efficiency', value: 'efficiency' },
      { text: 'Baker', value: 'created_by_email' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    const ingredientHeaders = [
      { text: 'Ingredient', value: 'name' },
      { text: 'Quantity Used', value: 'quantity' }
    ]
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }
    
    // Get color for efficiency
    const getEfficiencyColor = (efficiency: number) => {
      if (efficiency >= 100) return 'success'
      if (efficiency >= 90) return 'info'
      if (efficiency >= 75) return 'warning'
      return 'error'
    }
    
    // Fetch bakes
    const fetchBakes = () => {
      loading.value = true
      
      try {
        const bakesData = db.getAll<'bakes'>('bakes')
          .sort((a, b) => new Date(b.bake_date).getTime() - new Date(a.bake_date).getTime())
        
        const recipes = db.getAll<'recipes'>('recipes')
        const users = db.getAll<'users'>('users')
        
        // Transform data
        bakes.value = bakesData.map(item => {
          const recipe = recipes.find(r => r.id === item.recipe_id)
          const user = users.find(u => u.id === item.created_by)
          
          if (!recipe) {
            return {
              id: item.id,
              bake_date: item.bake_date,
              recipe_id: item.recipe_id,
              recipe_name: 'Unknown Recipe',
              expected_yield: 0,
              actual_yield: item.actual_yield,
              efficiency: 0,
              notes: item.notes,
              created_by: item.created_by,
              created_by_email: user?.email || 'Unknown'
            }
          }
          
          return {
            id: item.id,
            bake_date: item.bake_date,
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            expected_yield: recipe.expected_yield,
            actual_yield: item.actual_yield,
            efficiency: (item.actual_yield / recipe.expected_yield) * 100,
            notes: item.notes,
            created_by: item.created_by,
            created_by_email: user?.email || 'Unknown'
          }
        })
      } catch (error) {
        console.error('Error fetching bakes:', error)
      } finally {
        loading.value = false
      }
    }
    
    // View bake details
    const viewDetails = (bake: any) => {
      selectedBake.value = bake
      detailsDialog.value = true
      
      fetchBakeIngredients(bake.recipe_id)
    }
    
    // Fetch bake ingredients
    const fetchBakeIngredients = (recipeId: string) => {
      loadingIngredients.value = true
      
      try {
        const recipeIngs = db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.recipe_id === recipeId
        )
        
        const ingredients = db.getAll<'ingredients'>('ingredients')
        
        // Transform data
        bakeIngredients.value = recipeIngs.map(item => {
          const ingredient = ingredients.find(i => i.id === item.ingredient_id)
          
          if (!ingredient) {
            return {
              id: item.id,
              name: 'Unknown Ingredient',
              quantity: item.quantity,
              unit: ''
            }
          }
          
          return {
            id: item.id,
            name: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit
          }
        })
      } catch (error) {
        console.error('Error fetching bake ingredients:', error)
      } finally {
        loadingIngredients.value = false
      }
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'bakes' || table === 'recipes' || table === 'users') {
          fetchBakes()
        } else if (table === 'recipe_ingredients' && selectedBake.value) {
          fetchBakeIngredients(selectedBake.value.recipe_id)
        }
      })
    }
    
    onMounted(() => {
      fetchBakes()
      setupSubscription()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      loading,
      bakes,
      headers,
      detailsDialog,
      selectedBake,
      bakeIngredients,
      loadingIngredients,
      ingredientHeaders,
      formatDate,
      getEfficiencyColor,
      viewDetails
    }
  }
})
</script>