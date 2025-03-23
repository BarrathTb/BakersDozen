<template>
  <div>
    <v-btn
      text
      to="/recipes"
      class="mb-4"
    >
      <v-icon left>mdi-arrow-left</v-icon>
      Back to Recipes
    </v-btn>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    
    <div v-else-if="!recipe">
      <v-alert type="error">
        Recipe not found
      </v-alert>
    </div>
    
    <div v-else>
      <v-row>
        <v-col cols="12" md="8">
          <h1 class="text-h4 mb-4">{{ recipe.name }}</h1>
        </v-col>
        <v-col cols="12" md="4" class="d-flex justify-end align-center">
          <v-btn
            color="primary"
            @click="startBake"
          >
            <v-icon left>mdi-bread-slice</v-icon>
            Start Bake
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Recipe Details -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-information</v-icon>
          Recipe Details
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
                    <v-list-item-title>Expected Yield</v-list-item-title>
                    <v-list-item-subtitle>{{ recipe.expected_yield }} units</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-food-variant</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Ingredients</v-list-item-title>
                    <v-list-item-subtitle>{{ recipe.ingredients.length }} ingredients</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-account</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Created By</v-list-item-title>
                    <v-list-item-subtitle>{{ recipe.created_by_email }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon>mdi-calendar</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Created On</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(recipe.created_at) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- Ingredients -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-food-variant</v-icon>
          Ingredients
        </v-card-title>
        
        <v-card-text>
          <v-alert
            v-if="!hasEnoughIngredients"
            type="warning"
            class="mb-4"
          >
            <v-icon left>mdi-alert</v-icon>
            Not enough ingredients in stock for this recipe!
          </v-alert>
          
          <v-data-table
            :headers="ingredientHeaders"
            :items="recipe.ingredients"
            hide-default-footer
            class="elevation-1"
          >
            <template v-slot:item.required_quantity="{ item }">
              {{ item.quantity }} {{ item.unit }}
            </template>

            <template v-slot:item.current_quantity="{ item }">
              <v-chip
                :color="getQuantityColor(item.current_quantity, item.quantity)"
                text-color="white"
                small
              >
                {{ item.current_quantity }} {{ item.unit }}
              </v-chip>
            </template>

            <template v-slot:item.status="{ item }">
              <v-icon
                v-if="item.current_quantity >= item.quantity"
                color="success"
              >
                mdi-check-circle
              </v-icon>
              <v-icon
                v-else
                color="error"
              >
                mdi-alert-circle
              </v-icon>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
      
      <!-- Bake History -->
      <v-card>
        <v-card-title>
          <v-icon left>mdi-history</v-icon>
          Bake History
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :headers="bakeHeaders"
            :items="bakes"
            :loading="loadingBakes"
            :items-per-page="5"
            class="elevation-1"
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
            
            <template v-slot:item.baker="{ item }">
              {{ item.baker }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { db, type Recipe as DbRecipe, type Ingredient, type Bake as DbBake } from '../services/database'

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  current_quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  expected_yield: number;
  created_at: string;
  created_by: string;
  created_by_email: string;
  ingredients: RecipeIngredient[];
}

interface Bake {
  id: string;
  bake_date: string;
  actual_yield: number;
  efficiency: number;
  baker: string;
}

export default defineComponent({
  name: 'RecipeDetailView',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const recipeId = route.params.id as string
    
    const loading = ref(true)
    const recipe = ref<Recipe | null>(null)
    
    const loadingBakes = ref(true)
    const bakes = ref<Bake[]>([])
    
    const ingredientHeaders = [
      { text: 'Ingredient', value: 'name' },
      { text: 'Required', value: 'required_quantity' as const },
      { text: 'In Stock', value: 'current_quantity' as const },
      { text: 'Status', value: 'status' as const, align: 'center' as const, sortable: false }
    ]
    
    const bakeHeaders = [
      { text: 'Date', value: 'bake_date' as const },
      { text: 'Actual Yield', value: 'actual_yield' as const },
      { text: 'Efficiency', value: 'efficiency' as const },
      { text: 'Baker', value: 'baker' as const }
    ]
    
    // Check if we have enough ingredients for the recipe
    const hasEnoughIngredients = computed(() => {
      if (!recipe.value) return false
      return recipe.value.ingredients.every(
        (ingredient: RecipeIngredient) => ingredient.current_quantity >= ingredient.quantity
      )
    })
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy')
    }
    
    // Get color based on quantity level
    const getQuantityColor = (current: number, required: number) => {
      if (current < required) return 'error'
      if (current < required * 1.5) return 'warning'
      return 'success'
    }
    
    // Get color for efficiency
    const getEfficiencyColor = (efficiency: number) => {
      if (efficiency >= 100) return 'success'
      if (efficiency >= 90) return 'info'
      if (efficiency >= 75) return 'warning'
      return 'error'
    }
    
    // Fetch recipe details
    const fetchRecipe = async () => {
      loading.value = true
      
      try {
        const recipeData = await db.getById<'recipes'>('recipes', recipeId);
        if (!recipeData) throw new Error('Recipe not found');

        // Fetch recipe ingredients
        const recipeIngredients = await db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.recipe_id === recipeId);

        // Transform data
        recipe.value = {
          id: recipeData.id,
          name: recipeData.name,
          expected_yield: recipeData.expected_yield,
          created_at: recipeData.created_at,
          created_by: recipeData.created_by,
          created_by_email: (await db.getById<'users'>('users', recipeData.created_by))?.email || 'Unknown',
          ingredients: await Promise.all(recipeIngredients.map(async (recipeIngredient) => {
            const ingredient = await db.getById<'ingredients'>('ingredients', recipeIngredient.ingredient_id);
            return {
              id: ingredient?.id || '',
              name: ingredient?.name || '',
              quantity: recipeIngredient.quantity,
              current_quantity: ingredient?.current_quantity || 0,
              unit: ingredient?.unit || ''
            };
          }))
        }
      } catch (error) {
        console.error('Error fetching recipe:', error)
        recipe.value = null
      } finally {
        loading.value = false
      }
    }
    
    // Fetch bake history
    const fetchBakeHistory = async () => {
      loadingBakes.value = true
      
      try {
        const bakeData = await db.query<'bakes'>('bakes', item => item.recipe_id === recipeId);
        bakeData.sort((a, b) => new Date(b.bake_date).getTime() - new Date(a.bake_date).getTime());
        
        // Transform data
        bakes.value = await Promise.all(bakeData.map(async (item: DbBake) => {
          const user = await db.getById<'users'>('users', item.created_by);
          
          return {
            id: item.id,
            bake_date: item.bake_date,
            actual_yield: item.actual_yield,
            efficiency: recipe.value ? (item.actual_yield / recipe.value.expected_yield) * 100 : 0,
            baker: user?.email || 'Unknown'
          };
        }))
      } catch (error) {
        console.error('Error fetching bake history:', error)
      } finally {
        loadingBakes.value = false
      }
    }
    
    // Start a new bake with this recipe
    const startBake = () => {
      router.push({
        path: '/bakes/new',
        query: { recipe_id: recipeId }
      })
    }
    
    onMounted(() => {
      fetchRecipe().then(() => {
        fetchBakeHistory()
      })
    })
    
    return {
      loading,
      recipe,
      loadingBakes,
      bakes,
      ingredientHeaders,
      bakeHeaders,
      hasEnoughIngredients,
      formatDate,
      getQuantityColor,
      getEfficiencyColor,
      startBake
    }
  }
})
</script>