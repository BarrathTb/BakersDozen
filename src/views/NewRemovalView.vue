<template>
  <div>
    <h1 class="text-h4 mb-4">New Removal</h1>
    
    <v-card>
      <v-card-title>
        <v-icon left>mdi-minus-circle</v-icon>
        Record Ingredient Removal
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pt-4">
        <v-form ref="form" v-model="isFormValid">
          <!-- Removal Information -->
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="reason"
                :items="reasonOptions"
                label="Removal Reason"
                :rules="[v => !!v || 'Reason is required']"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-menu
                ref="removalDateMenu"
                v-model="removalDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="removalDate"
                    label="Removal Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    :rules="[v => !!v || 'Removal date is required']"
                    required
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="removalDate"
                  @input="removalDateMenu = false"
                  :max="new Date().toISOString().substr(0, 10)"
                ></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>
          
          <!-- Ingredient Selection -->
          <v-card outlined class="mt-4 mb-4">
            <v-card-title>
              <v-icon left>mdi-package-variant-closed</v-icon>
              Select Ingredients
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="ingredients"
                :search="search"
                :loading="loading"
                item-key="id"
                show-select
                v-model="selectedIngredients"
                :items-per-page="10"
                class="elevation-1"
              >
                <template v-slot:top>
                  <v-text-field
                    v-model="search"
                    label="Search Ingredients"
                    prepend-icon="mdi-magnify"
                    class="mx-4 mt-4"
                    hide-details
                  ></v-text-field>
                </template>
                
                <template v-slot:item.current_quantity="{ item }">
                  {{ item.current_quantity }} {{ item.unit }}
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
          
          <!-- Quantity Adjustments -->
          <v-card outlined class="mb-4" v-if="selectedIngredients.length > 0">
            <v-card-title>
              <v-icon left>mdi-scale</v-icon>
              Quantity Adjustments
            </v-card-title>
            <v-card-text>
              <v-alert
                type="warning"
                text
                class="mb-4"
              >
                Please specify the quantity to remove for each selected ingredient.
              </v-alert>
              
              <v-row
                v-for="ingredient in selectedIngredients"
                :key="ingredient.id"
                align="center"
                class="mb-2"
              >
                <v-col cols="6" md="4">
                  <strong>{{ ingredient.name }}</strong>
                  <div class="text-caption">
                    Current: {{ ingredient.current_quantity }} {{ ingredient.unit }}
                  </div>
                </v-col>
                <v-col cols="6" md="4">
                  <v-text-field
                    v-model.number="removalQuantities[ingredient.id]"
                    :label="`Quantity to Remove (${ingredient.unit})`"
                    type="number"
                    min="0.01"
                    :max="ingredient.current_quantity"
                    step="0.01"
                    :rules="[
                      v => !!v || 'Quantity is required',
                      v => v > 0 || 'Quantity must be greater than 0',
                      v => v <= ingredient.current_quantity || 'Cannot remove more than available'
                    ]"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-slider
                    v-model.number="removalQuantities[ingredient.id]"
                    :min="0"
                    :max="ingredient.current_quantity"
                    :step="ingredient.current_quantity / 100"
                    thumb-label="always"
                    :thumb-size="24"
                  ></v-slider>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isFormValid || selectedIngredients.length === 0 || !isValidQuantities || submitting"
          @click="submitRemoval"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save Removal
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      Removal recorded successfully!
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
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
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="showErrorAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../plugins/supabase'
import { useAuthStore } from '../stores/auth'

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  unit: string
}

export default defineComponent({
  name: 'NewRemovalView',
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const loading = ref(false)
    const submitting = ref(false)
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const errorMessage = ref('')
    
    // Removal information
    const reason = ref('')
    const reasonOptions = [
      { text: 'Waste/Expired', value: 'waste' },
      { text: 'Used for Sale', value: 'sale' },
      { text: 'Transferred', value: 'transfer' }
    ]
    const removalDate = ref(new Date().toISOString().substr(0, 10))
    const removalDateMenu = ref(false)
    
    // Ingredient selection
    const search = ref('')
    const ingredients = ref<Ingredient[]>([])
    const selectedIngredients = ref<Ingredient[]>([])
    const removalQuantities = reactive<Record<string, number>>({})
    
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Current Quantity', value: 'current_quantity' },
      { text: 'Unit', value: 'unit' }
    ]
    
    // Validate that all selected ingredients have valid quantities
    const isValidQuantities = computed(() => {
      return selectedIngredients.value.every(ingredient => {
        const quantity = removalQuantities[ingredient.id]
        return (
          quantity !== undefined &&
          quantity > 0 &&
          quantity <= ingredient.current_quantity
        )
      })
    })
    
    // Fetch ingredients
    const fetchIngredients = async () => {
      loading.value = true
      
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .select('id, name, current_quantity, unit')
          .gt('current_quantity', 0) // Only show ingredients with stock
          .order('name')
        
        if (error) throw error
        
        ingredients.value = data || []
      } catch (error) {
        console.error('Error fetching ingredients:', error)
        showError('Failed to load ingredients')
      } finally {
        loading.value = false
      }
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }
    
    // Submit the removal
    const submitRemoval = async () => {
      if (!isFormValid.value || selectedIngredients.value.length === 0 || !isValidQuantities.value) {
        form.value?.validate()
        return
      }
      
      if (!authStore.user) {
        showError('You must be logged in to submit a removal')
        return
      }
      
      submitting.value = true
      
      try {
        // Insert removal record
        const { data: removalData, error: removalError } = await supabase
          .from('removals')
          .insert({
            reason: reason.value,
            removal_date: new Date(removalDate.value).toISOString(),
            created_by: authStore.user.id
          })
          .select()
          .single()
        
        if (removalError) throw removalError
        
        // Insert removal items
        const removalItemsToInsert = selectedIngredients.value.map(ingredient => ({
          removal_id: removalData.id,
          ingredient_id: ingredient.id,
          quantity: removalQuantities[ingredient.id]
        }))
        
        const { error: itemsError } = await supabase
          .from('removal_items')
          .insert(removalItemsToInsert)
        
        if (itemsError) throw itemsError
        
        // Show success message
        showSuccessAlert.value = true
        
        // Navigate to removals list after a delay
        setTimeout(() => {
          router.push('/removals')
        }, 1500)
      } catch (error: any) {
        console.error('Error submitting removal:', error)
        showError(error.message || 'Failed to submit removal')
      } finally {
        submitting.value = false
      }
    }
    
    // Cancel and go back
    const cancel = () => {
      router.push('/removals')
    }
    
    // Initialize default removal quantities when ingredients are selected
    watch(selectedIngredients, (newVal) => {
      newVal.forEach(ingredient => {
        if (removalQuantities[ingredient.id] === undefined) {
          removalQuantities[ingredient.id] = ingredient.current_quantity / 2
        }
      })
      
      // Remove quantities for deselected ingredients
      Object.keys(removalQuantities).forEach(id => {
        if (!newVal.some(ingredient => ingredient.id === id)) {
          delete removalQuantities[id]
        }
      })
    })
    
    onMounted(() => {
      fetchIngredients()
    })
    
    return {
      form,
      isFormValid,
      loading,
      submitting,
      showSuccessAlert,
      showErrorAlert,
      errorMessage,
      reason,
      reasonOptions,
      removalDate,
      removalDateMenu,
      search,
      ingredients,
      selectedIngredients,
      removalQuantities,
      headers,
      isValidQuantities,
      cancel,
      submitRemoval
    }
  }
})
</script>