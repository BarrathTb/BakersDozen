<template>
  <div>
    <v-form ref="form" v-model="isFormValid">
      <!-- Supplier Information -->
      <v-card class="mb-4">
        <v-card-title>
          <v-icon left>mdi-truck-delivery</v-icon>
          Supplier Information
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="supplier"
                label="Supplier Name"
                :rules="[v => !!v || 'Supplier name is required']"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="deliveryDate"
                label="Delivery Date"
                type="date"
                :rules="[v => !!v || 'Delivery date is required']"
                required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Delivery Items -->
      <v-card class="mb-4">
        <v-card-title class="d-flex justify-space-between">
          <div>
            <v-icon left>mdi-package-variant-closed</v-icon>
            Delivery Items
          </div>
          <v-btn color="primary" @click="addItem">
            <v-icon left>mdi-plus</v-icon>
            Add Item
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="deliveryItems.length === 0"
            type="info"
            variant="outlined"
          >
            No items added yet. Click "Add Item" to add ingredients to this delivery.
          </v-alert>

          <div v-for="(item, index) in deliveryItems" :key="index" class="mb-4">
            <v-card outlined>
              <v-card-title class="d-flex justify-space-between">
                <div>Item #{{ index + 1 }}</div>
                <v-btn icon color="error" @click="removeItem(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-autocomplete
                      v-model="item.ingredient_id"
                      :items="ingredients"
                      item-title="name"
                      item-value="id"
                      label="Ingredient"
                      :rules="[v => !!v || 'Ingredient is required']"
                      required
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                          <v-list-item-subtitle>
                            Current: {{ item.raw.current_quantity }} {{ item.raw.unit }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="item.quantity"
                      label="Quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      :suffix="getIngredientUnit(item.ingredient_id)"
                      :rules="[
                        v => !!v || 'Quantity is required',
                        v => v > 0 || 'Quantity must be greater than 0'
                      ]"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="item.batch_number"
                      label="Batch Number"
                      :rules="[v => !!v || 'Batch number is required']"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="item.expiry_date"
                      label="Expiry Date"
                      type="date"
                      :rules="[v => !!v || 'Expiry date is required']"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>

      <!-- Submit Button -->
      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!isFormValid || deliveryItems.length === 0 || loading"
          @click="submitDelivery"
        >
          <v-icon left>mdi-content-save</v-icon>
          Save Delivery
        </v-btn>
      </div>
    </v-form>

    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      Delivery recorded successfully!
      <template #actions>
        <v-btn
          variant="text"
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
      <template #actions>
        <v-btn
          variant="text"
          @click="showErrorAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../services/database'
import { useAuthStore } from '../../stores/auth'

interface DeliveryItem {
  ingredient_id: string
  quantity: number
  batch_number: string
  expiry_date: string
}

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  unit: string
}

export default defineComponent({
  name: 'DeliveryForm',
  
  emits: ['delivery-saved'],
  
  setup(props, { emit }) {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const loading = ref(false)
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const errorMessage = ref('')
    
    // Supplier information
    const supplier = ref('')
    const deliveryDate = ref(new Date().toISOString().substr(0, 10))
    
    // Delivery items
    const deliveryItems = ref<DeliveryItem[]>([])
    const ingredients = ref<Ingredient[]>([])
    
    // Helper function to get a default expiry date (30 days from now)
    const getDefaultExpiryDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().substr(0, 10);
    }
    
    // Fetch ingredients
    const fetchIngredients = () => {
      try {
        ingredients.value = db.getAll<'ingredients'>('ingredients')
          .sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Error fetching ingredients:', error)
        showError('Failed to load ingredients')
      }
    }
    
    // Get unit for an ingredient
    const getIngredientUnit = (ingredientId: string) => {
      const ingredient = ingredients.value.find(i => i.id === ingredientId)
      return ingredient ? ingredient.unit : ''
    }
    
    // Add a new delivery item
    const addItem = () => {
      deliveryItems.value.push({
        ingredient_id: '',
        quantity: 0,
        batch_number: '',
        expiry_date: getDefaultExpiryDate()
      })
    }
    
    // Remove a delivery item
    const removeItem = (index: number) => {
      deliveryItems.value.splice(index, 1)
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }
    
    // Format date string to ISO string with time component
    const formatDateString = (dateStr: string): string => {
      try {
        // Ensure the date string is in YYYY-MM-DD format and add time component
        if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateStr}T00:00:00Z`;
        }
        // If it's already in ISO format or other valid format, return as is
        return dateStr;
      } catch (e) {
        console.error('Error formatting date:', e);
        return new Date().toISOString(); // Fallback to current date
      }
    }
    
    // Submit the delivery
    const submitDelivery = () => {
      if (!isFormValid.value || deliveryItems.value.length === 0) {
        form.value?.validate()
        return
      }
      
      if (!authStore.user) {
        showError('You must be logged in to submit a delivery')
        return
      }
      
      loading.value = true
      
      try {
        // Insert delivery record
        const deliveryData = db.insert('deliveries', {
          supplier: supplier.value,
          delivery_date: formatDateString(deliveryDate.value),
          created_by: authStore.user.id,
          created_at: new Date().toISOString()
        })
        
        // Insert delivery items
        deliveryItems.value.forEach(item => {
          db.insert('delivery_items', {
            delivery_id: deliveryData.id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            batch_number: item.batch_number,
            expiry_date: formatDateString(item.expiry_date)
          })
          
          // Update ingredient quantity
          const ingredient = db.getById<'ingredients'>('ingredients', item.ingredient_id)
          if (ingredient) {
            db.update('ingredients', {
              id: ingredient.id,
              current_quantity: ingredient.current_quantity + item.quantity,
              last_updated: new Date().toISOString()
            })
          }
        })
        
        // Show success message
        showSuccessAlert.value = true
        
        // Reset form
        resetForm()
        
        // Emit event
        emit('delivery-saved', deliveryData.id)
      } catch (error: any) {
        console.error('Error submitting delivery:', error)
        showError(error.message || 'Failed to submit delivery')
      } finally {
        loading.value = false
      }
    }
    
    // Reset the form
    const resetForm = () => {
      supplier.value = ''
      deliveryDate.value = new Date().toISOString().substr(0, 10)
      deliveryItems.value = []
      form.value?.reset()
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'ingredients') {
          fetchIngredients()
        }
      })
    }
    
    onMounted(() => {
      fetchIngredients()
      setupSubscription()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      form,
      isFormValid,
      loading,
      showSuccessAlert,
      showErrorAlert,
      errorMessage,
      supplier,
      deliveryDate,
      deliveryItems,
      ingredients,
      getIngredientUnit,
      addItem,
      removeItem,
      submitDelivery,
      getDefaultExpiryDate,
      formatDateString
    }
  }
})
</script>