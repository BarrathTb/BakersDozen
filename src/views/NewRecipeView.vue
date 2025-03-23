<template>
  <div>
    <h1 class="text-h4 mb-4">New Recipe</h1>
    
    <v-form ref="form" v-model="isFormValid">
      <!-- Recipe Details -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-book-open-variant</v-icon>
          Recipe Details
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="name"
                label="Recipe Name"
                :rules="[v => !!v || 'Recipe name is required']"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="expectedYield"
                label="Expected Yield"
                type="number"
                min="1"
                step="1"
                :rules="[
                  v => !!v || 'Expected yield is required',
                  v => v > 0 || 'Expected yield must be greater than 0'
                ]"
                required
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-textarea
            v-model="description"
            label="Recipe Description (Optional)"
            rows="3"
            counter
            maxlength="500"
          ></v-textarea>
        </v-card-text>
      </v-card>

      <!-- Ingredients -->
      <v-card class="mb-4">
        <v-card-title class="d-flex justify-space-between">
          <div>
            <v-icon left>mdi-food-variant</v-icon>
            Ingredients
          </div>
          <v-btn color="primary" @click="addIngredient">
            <v-icon left>mdi-plus</v-icon>
            Add Ingredient
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="ingredients.length === 0"
            type="info"
          >
            No ingredients added yet. Click "Add Ingredient" to add ingredients to this recipe.
          </v-alert>

          <div v-for="(ingredient, index) in ingredients" :key="index" class="mb-4">
            <v-card outlined>
              <v-card-title class="d-flex justify-space-between">
                <div>Ingredient #{{ index + 1 }}</div>
                <v-btn icon color="error" @click="removeIngredient(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                     <v-combobox
                        v-model="ingredient.ingredientId"
                        :items="availableIngredients"
                        item-title="name"
                        item-value="id"
                        label="Ingredient"
                        :rules="[v => !!v || 'Ingredient is required']"
                        required
                        @change="updateIngredientDetails(index)"
                      >
                        <template v-slot:item="{ props, item }">
                          <v-list-item v-bind="props">
                            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                              In Stock: {{ item.raw.current_quantity }} {{ item.raw.unit }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </template>
                        
                        <template v-slot:selection="{ item }">
                          {{ item.raw.name }}
                        </template>
                      </v-combobox>

                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="ingredient.quantity"
                      label="Quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      :suffix="ingredient.unit"
                      :rules="[
                        v => !!v || 'Quantity is required',
                        v => v > 0 || 'Quantity must be greater than 0'
                      ]"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>

      <!-- Instructions -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-format-list-numbered</v-icon>
          Instructions (Optional)
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="instructions"
            label="Recipe Instructions"
            rows="6"
            counter
            maxlength="2000"
            hint="Enter step-by-step instructions for preparing this recipe"
          ></v-textarea>
        </v-card-text>
      </v-card>

      <!-- Submit Button -->
      <div class="d-flex justify-end">
        <v-btn
          text
          class="mr-4"
          to="/recipes"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isFormValid || ingredients.length === 0 || submitting"
          @click="submitRecipe"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save Recipe
        </v-btn>
      </div>
    </v-form>
    
    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      Recipe saved successfully!
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
          @click="showErrorAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, type Ingredient as DbIngredient } from '../services/database'
import { useAuthStore } from '../stores/auth'

interface Ingredient {
  id: string | null
  ingredientId: string | null
  name: string
  quantity: number
  unit: string
  current_quantity: number
}

export default defineComponent({
  name: 'NewRecipeView',
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const submitting = ref(false)
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const errorMessage = ref('')
    
    // Recipe details
    const name = ref('')
    const expectedYield = ref<number>(1)
    const description = ref('')
    const instructions = ref('')
    
    // Ingredients
    const availableIngredients = ref<DbIngredient[]>([])
    const ingredients = ref<Ingredient[]>([])
    
    // Fetch available ingredients
    const fetchIngredients = async () => {
      try {
        // Get all ingredients from the database
        const data = await db.getAll<'ingredients'>('ingredients');
        
        // Sort ingredients by name
        availableIngredients.value = data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      } catch (error) {
        console.error('Error fetching ingredients:', error)
        showError('Failed to load ingredients')
      }
    }
    
    // Add a new ingredient to the recipe
    const addIngredient = () => {
      ingredients.value.push({
        id: null,
        ingredientId: null,
        name: '',
        quantity: 0,
        unit: '',
        current_quantity: 0
      })
    }
    
    // Remove an ingredient from the recipe
    const removeIngredient = (index: number) => {
      ingredients.value.splice(index, 1)
    }
    
    // Update ingredient details when selected
    const updateIngredientDetails = (index: number) => {
      const selectedIngredient = ingredients.value[index]
      
      if (selectedIngredient.ingredientId) {
        const ingredientData = availableIngredients.value.find(i => i.id === selectedIngredient.ingredientId)
        
        if (ingredientData) {
          ingredients.value[index] = {
            ...selectedIngredient,
            name: ingredientData.name,
            unit: ingredientData.unit,
            current_quantity: ingredientData.current_quantity
          }
        }
      }
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }
    
    // Submit the recipe
    const submitRecipe = async () => {
      if (!isFormValid.value || ingredients.value.length === 0) {
        form.value?.validate()
        return
      }
      
      if (!authStore.user) {
        showError('You must be logged in to create a recipe')
        return
      }
      
      submitting.value = true
      
      try {
        // Generate a new recipe with the current timestamp
        const now = new Date().toISOString();
        
        // Insert recipe record
        const recipeData = await db.insert<'recipes'>('recipes', {
          name: name.value,
          expected_yield: expectedYield.value,
          created_by: authStore.user.id,
          created_at: now
        });
        
        // Insert recipe ingredients
        for (const item of ingredients.value) {
          if (!item.ingredientId) {
            throw new Error('Invalid ingredient selection');
          }
          
          await db.insert<'recipe_ingredients'>('recipe_ingredients', {
            recipe_id: recipeData.id,
            ingredient_id: item.ingredientId,
            quantity: item.quantity
          });
        }
        
        // Show success message
        showSuccessAlert.value = true
        
        // Navigate to recipe details after a delay
        setTimeout(() => {
          router.push(`/recipes/${recipeData.id}`)
        }, 1500)
      } catch (error: any) {
        console.error('Error submitting recipe:', error)
        showError(error.message || 'Failed to save recipe')
      } finally {
        submitting.value = false
      }
    }
    
    onMounted(() => {
      fetchIngredients()
    })
    
    return {
      form,
      isFormValid,
      submitting,
      showSuccessAlert,
      showErrorAlert,
      errorMessage,
      name,
      expectedYield,
      description,
      instructions,
      availableIngredients,
      ingredients,
      addIngredient,
      removeIngredient,
      updateIngredientDetails,
      submitRecipe
    }
  }
})
</script>