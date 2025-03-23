<template>
  <div>
    <h1 class="text-h4 mb-4">Inventory Management</h1>
    
    <!-- Inventory Summary -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h6 mb-2">Total Ingredients</div>
            <div class="text-h3">{{ totalIngredients }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h6 mb-2">Low Stock Items</div>
            <div class="text-h3" :class="lowStockCount > 0 ? 'warning--text' : ''">
              {{ lowStockCount }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h6 mb-2">Out of Stock</div>
            <div class="text-h3" :class="outOfStockCount > 0 ? 'error--text' : ''">
              {{ outOfStockCount }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Inventory Actions -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-btn
          block
          color="primary"
          to="/deliveries/new"
          height="50"
        >
          <v-icon left>mdi-truck-delivery</v-icon>
          New Delivery
        </v-btn>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-btn
          block
          color="secondary"
          to="/removals/new"
          height="50"
        >
          <v-icon left>mdi-minus-circle</v-icon>
          New Removal
        </v-btn>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-btn
          block
          color="accent"
          to="/bakes/new"
          height="50"
        >
          <v-icon left>mdi-bread-slice</v-icon>
          New Bake
        </v-btn>
      </v-col>
    </v-row>
    
    <!-- Inventory List -->
    <v-card>
      <v-card-title>
        <v-icon left>mdi-package-variant-closed</v-icon>
        Ingredient Inventory
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          dense
        ></v-text-field>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="ingredients"
          :search="search"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
          :sort-by="[{ key: 'name' }]"
        >
          <template v-slot:item.current_quantity="{ item }">
            <v-chip
              :color="getQuantityColor(item.current_quantity, item.min_quantity)"
              text-color="white"
              small
            >
              {{ item.current_quantity }} {{ item.unit }}
            </v-chip>
          </template>
          
          <template v-slot:item.min_quantity="{ item }">
            {{ item.min_quantity }} {{ item.unit }}
          </template>
          
          <template v-slot:item.last_updated="{ item }">
            {{ formatDate(item.last_updated) }}
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              small
              color="primary"
              :to="`/inventory/${item.id}`"
              title="View Details"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- View Toggle -->
    <div class="d-flex justify-end mt-4">
      <v-btn-toggle v-model="viewType" mandatory>
        <v-btn value="table">
          <v-icon>mdi-table</v-icon>
        </v-btn>
        <v-btn value="grid">
          <v-icon>mdi-view-grid</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
    
    <!-- Grid View -->
    <v-row v-if="viewType === 'grid'" class="mt-4">
      <v-col
        v-for="ingredient in ingredients"
        :key="ingredient.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <inventory-card
          :ingredient="ingredient"
          @add-to-delivery="addToDelivery(ingredient)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { db } from '../services/database'
import InventoryCard from '../components/inventory/InventoryCard.vue'

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

export default defineComponent({
  name: 'InventoryView',
  
  components: {
    InventoryCard
  },
  
  setup() {
    const loading = ref(true)
    const ingredients = ref<Ingredient[]>([])
    const search = ref('')
    const viewType = ref('table')
    
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Current Quantity', value: 'current_quantity' },
      { text: 'Min Quantity', value: 'min_quantity' },
      { text: 'Unit', value: 'unit' },
      { text: 'Last Updated', value: 'last_updated' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    // Computed properties for summary cards
    const totalIngredients = computed(() => ingredients.value.length)
    
    const lowStockCount = computed(() => 
      ingredients.value.filter(item => 
        item.current_quantity > 0 && 
        item.current_quantity <= item.min_quantity
      ).length
    )
    
    const outOfStockCount = computed(() => 
      ingredients.value.filter(item => 
        item.current_quantity <= 0
      ).length
    )
    
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
    
    // Fetch ingredients
    const fetchIngredients = async () => {
      loading.value = true
      
      try {
        const result = await db.getAll<'ingredients'>('ingredients')
        ingredients.value = result.sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Error fetching ingredients:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Add ingredient to a new delivery
    const addToDelivery = (ingredient: Ingredient) => {
      // In a real app, this would add the ingredient to a delivery cart or navigate to the delivery form
      console.log('Add to delivery:', ingredient)
      // For now, just navigate to the new delivery page
      window.location.href = '/deliveries/new'
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
      loading,
      ingredients,
      search,
      viewType,
      headers,
      totalIngredients,
      lowStockCount,
      outOfStockCount,
      formatDate,
      getQuantityColor,
      addToDelivery
    }
  }
})
</script>