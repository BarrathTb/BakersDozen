<template>
  <div class="bake-tracker-container">
    <v-form ref="form" v-model="isFormValid">
      <!-- Recipe Selection -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-bread-slice</v-icon>
          Recipe Selection
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedRecipe"
                :items="recipes"
                item-title="name"
                item-value="id"
                label="Select Recipe"
                :rules="[v => !!v || 'Recipe is required']"
                return-object
                required
                @update:model-value="recipeSelected"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Expected Yield: {{ item.raw.expected_yield }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-combobox>

            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="bakeDate"
                label="Bake Date"
                prepend-icon="mdi-calendar"
                readonly
                @click="openDatePicker"
                :rules="[v => !!v || 'Bake date is required']"
                required
              ></v-text-field>
              
              <v-dialog
                v-model="bakeDateMenu"
                width="290px"
              >
                <v-date-picker
                  v-model="bakeDate"
                  @update:model-value="bakeDateMenu = false"
                  :max="new Date().toISOString().substring(0, 10)"
                ></v-date-picker>
              </v-dialog>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Recipe Ingredients -->
      <v-card class="mb-4" v-if="selectedRecipe">
        <v-card-title>
          <v-icon left>mdi-format-list-checks</v-icon>
          Recipe Ingredients
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="!hasEnoughIngredients"
            type="warning"
            variant="outlined"
            class="mb-4"
          >
            <v-icon left>mdi-alert</v-icon>
            Not enough ingredients in stock for this recipe!
          </v-alert>
          
          <v-data-table
            :headers="ingredientHeaders"
            :items="recipeIngredients"
            :loading="loadingIngredients"
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

      <!-- Production Tracking -->
      <v-card class="mb-4" v-if="selectedRecipe">
        <v-card-title>
          <v-icon left>mdi-chart-line</v-icon>
          Production Tracking
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                :value="selectedRecipe.expected_yield"
                label="Expected Yield"
                readonly
                suffix="units"
                outlined
                disabled
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="actualYield"
                label="Actual Yield"
                type="number"
                min="0"
                step="1"
                suffix="units"
                :rules="[
                  v => !!v || 'Actual yield is required',
                  v => v > 0 || 'Actual yield must be greater than 0'
                ]"
                required
                @input="calculateEfficiency"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row v-if="actualYield > 0">
            <v-col cols="12">
              <v-card outlined>
                <v-card-text>
                  <div class="text-h6 mb-2">Production Efficiency</div>
                  <v-progress-linear
                    :value="efficiencyPercentage"
                    :color="efficiencyColor"
                    height="25"
                    striped
                  >
                    <template v-slot:default>
                      <strong>{{ efficiencyPercentage.toFixed(1) }}%</strong>
                    </template>
                  </v-progress-linear>
                  
                  <div class="mt-4 text-body-1">
                    <v-icon :color="efficiencyColor" left>
                      {{ efficiencyIcon }}
                    </v-icon>
                    {{ efficiencyMessage }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Notes -->
      <v-card class="mb-4" v-if="selectedRecipe">
        <v-card-title>
          <v-icon left>mdi-note-text</v-icon>
          Notes
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="notes"
            label="Production Notes"
            hint="Optional: Add any notes about this bake (issues, variations, etc.)"
            rows="3"
            counter
            maxlength="500"
          ></v-textarea>
        </v-card-text>
      </v-card>

      <!-- Submit Button -->
      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isFormValid || !selectedRecipe || !hasEnoughIngredients || submitting"
          @click="submitBake"
        >
          <v-icon left>mdi-content-save</v-icon>
          Record Bake
        </v-btn>
      </div>
    </v-form>

    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      Bake recorded successfully!
      <template v-slot:actions>
        <v-btn
          text
          @click="showSuccessAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="showErrorAlert"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          text
          @click="closeErrorAlert"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { db } from '../../services/database'

interface Recipe {
  id: string
  name: string
  expected_yield: number
}

interface RecipeIngredient {
  id: string
  name: string
  quantity: number
  current_quantity: number
  unit: string
}

export default defineComponent({
  name: 'BakeTracker',
  
  emits: ['bake-saved'],
  
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const submitting = ref(false)
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const errorMessage = ref('')
    
    // Recipe selection
    const recipes = ref<Recipe[]>([])
    const selectedRecipe = ref<Recipe | null>(null)
    const bakeDate = ref<string>(new Date().toISOString().substring(0, 10))
    const bakeDateMenu = ref(false)
    
    // Recipe ingredients
    const recipeIngredients = ref<RecipeIngredient[]>([])
    const loadingIngredients = ref(false)
    
    // Production tracking
    const actualYield = ref<number>(0)
    const efficiencyPercentage = ref(0)
    const notes = ref('')
    
    const ingredientHeaders = [
      { text: 'Ingredient', value: 'name', align: 'start' as const },
      { text: 'Required', value: 'required_quantity', align: 'start' as const },
      { text: 'In Stock', value: 'current_quantity', align: 'start' as const },
      { text: 'Status', value: 'status', align: 'center' as const, sortable: false }
    ]
    
    // Check if we have enough ingredients for the recipe
    const hasEnoughIngredients = computed(() => {
      return recipeIngredients.value.every(
        ingredient => ingredient.current_quantity >= ingredient.quantity
      )
    })
    
    // Determine efficiency color
    const efficiencyColor = computed(() => {
      if (efficiencyPercentage.value >= 100) return 'success'
      if (efficiencyPercentage.value >= 90) return 'info'
      if (efficiencyPercentage.value >= 75) return 'warning'
      return 'error'
    })
    
    // Determine efficiency icon
    const efficiencyIcon = computed(() => {
      if (efficiencyPercentage.value >= 100) return 'mdi-thumb-up'
      if (efficiencyPercentage.value >= 90) return 'mdi-check-circle'
      if (efficiencyPercentage.value >= 75) return 'mdi-alert'
      return 'mdi-alert-circle'
    })
    
    // Efficiency message
    const efficiencyMessage = computed(() => {
      if (efficiencyPercentage.value >= 100) {
        return `Great job! You exceeded the expected yield by ${(efficiencyPercentage.value - 100).toFixed(1)}%`
      }
      if (efficiencyPercentage.value >= 90) {
        return 'Good efficiency! Close to expected yield.'
      }
      if (efficiencyPercentage.value >= 75) {
        return 'Below expected yield. Check process for improvements.'
      }
      return 'Significantly below expected yield. Process review recommended.'
    })
    
    // Open date picker
    const openDatePicker = () => {
      bakeDateMenu.value = true
    }
    
    // Fetch recipes
    const fetchRecipes = async () => {
      try {
        const recipesData = await db.getAll<'recipes'>('recipes')
        recipes.value = recipesData.sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Error fetching recipes:', error)
        showError('Failed to load recipes')
      }
    }
    
    // Fetch recipe ingredients when a recipe is selected
    const recipeSelected = async () => {
      if (!selectedRecipe.value) return
      
      loadingIngredients.value = true
      
      try {
        // Get recipe ingredients
        const recipeIngs = await db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.recipe_id === selectedRecipe.value!.id
        )
        
        const ingredients = await db.getAll<'ingredients'>('ingredients')
        
        // Transform data for display
        recipeIngredients.value = recipeIngs.map(item => {
          const ingredient = ingredients.find(i => i.id === item.ingredient_id)
          
          if (!ingredient) {
            return {
              id: item.ingredient_id,
              name: 'Unknown',
              quantity: item.quantity,
              current_quantity: 0,
              unit: ''
            }
          }
          
          return {
            id: ingredient.id,
            name: ingredient.name,
            quantity: item.quantity,
            current_quantity: ingredient.current_quantity,
            unit: ingredient.unit
          }
        })
        
        // Set default actual yield to expected yield
        actualYield.value = selectedRecipe.value.expected_yield
        calculateEfficiency()
      } catch (error) {
        console.error('Error fetching recipe ingredients:', error)
        showError('Failed to load recipe ingredients')
      } finally {
        loadingIngredients.value = false
      }
    }
    
    // Calculate efficiency percentage
    const calculateEfficiency = () => {
      if (!selectedRecipe.value || !actualYield.value) {
        efficiencyPercentage.value = 0
        return
      }
      
      efficiencyPercentage.value = (actualYield.value / selectedRecipe.value.expected_yield) * 100
    }
    
    // Get color based on quantity level
    const getQuantityColor = (current: number, required: number) => {
      if (current < required) return 'error'
      if (current < required * 1.5) return 'warning'
      return 'success'
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }

    // Close error alert
    const closeErrorAlert = () => {
      showErrorAlert.value = false
    }
    
    // Submit the bake
    const submitBake = async () => {
      if (!isFormValid.value || !selectedRecipe.value || !hasEnoughIngredients.value) {
        form.value?.validate()
        return
      }
      
      if (!authStore.user) {
        showError('You must be logged in to record a bake')
        return
      }
      
      submitting.value = true
      
      try {
        // Insert bake record
        const bakeData = await db.insert('bakes', {
          recipe_id: selectedRecipe.value.id,
          actual_yield: actualYield.value,
          bake_date: new Date(bakeDate.value).toISOString(),
          created_by: authStore.user.id,
          notes: notes.value || null
        })
        
        // Update ingredient quantities
        for (const item of recipeIngredients.value) {
          const ingredient = await db.getById<'ingredients'>('ingredients', item.id)
          if (ingredient) {
            await db.update('ingredients', {
              id: ingredient.id,
              current_quantity: ingredient.current_quantity - item.quantity,
              last_updated: new Date().toISOString()
            })
          }
        }
        
        // Show success message
        showSuccessAlert.value = true
        
        // Reset form
        resetForm()
        
        // Emit event
        emit('bake-saved', bakeData.id)
      } catch (error: any) {
        console.error('Error submitting bake:', error)
        showError(error.message || 'Failed to record bake')
      } finally {
        submitting.value = false
      }
    }
    
    // Reset the form
    const resetForm = () => {
      selectedRecipe.value = null
      bakeDate.value = new Date().toISOString().substring(0, 10)
      recipeIngredients.value = []
      actualYield.value = 0
      efficiencyPercentage.value = 0
      notes.value = ''
      form.value?.reset()
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'recipes') {
          fetchRecipes()
        } else if (table === 'ingredients' && selectedRecipe.value) {
          recipeSelected()
        }
      })
    }
    
    onMounted(() => {
      fetchRecipes()
      setupSubscription()
      // Ensure date picker is closed on mount
      bakeDateMenu.value = false
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
      // Ensure date picker is closed on unmount
      bakeDateMenu.value = false
    })
    
    return {
      form,
      isFormValid,
      submitting,
      showSuccessAlert,
      showErrorAlert,
      errorMessage,
      recipes,
      selectedRecipe,
      bakeDate,
      bakeDateMenu,
      recipeIngredients,
      loadingIngredients,
      actualYield,
      efficiencyPercentage,
      efficiencyColor,
      efficiencyIcon,
      efficiencyMessage,
      notes,
      ingredientHeaders,
      hasEnoughIngredients,
      recipeSelected,
      getQuantityColor,
      openDatePicker,
      closeErrorAlert,
      calculateEfficiency,
      submitBake
    }
  }
})
</script>

<style>
.bake-tracker-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.v-card {
  margin-bottom: 24px;
}
</style>