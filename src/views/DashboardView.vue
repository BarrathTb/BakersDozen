<template>
  <div>
    <h1 class="text-h4 mb-4">Dashboard</h1>
    
    <!-- Quick Action Cards -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4 action-card" height="150" color="primary" dark to="/deliveries/new">
          <v-card-title class="action-title">
            <v-icon left size="24">mdi-truck-delivery</v-icon>
            New Delivery
          </v-card-title>
          <v-card-text class="action-text">
            Record a new ingredient delivery
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="mb-4 action-card" height="150" color="secondary" dark to="/removals/new">
          <v-card-title class="action-title">
            <v-icon left size="24">mdi-minus-circle</v-icon>
            New Removal
          </v-card-title>
          <v-card-text class="action-text">
            Record ingredient removal (waste/sale/transfer)
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="mb-4 action-card" height="150" color="accent" dark to="/bakes/new">
          <v-card-title class="action-title">
            <v-icon left size="24">mdi-bread-slice</v-icon>
            New Bake
          </v-card-title>
          <v-card-text class="action-text">
            Record a new bake and update inventory
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Inventory Status -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon left>mdi-package-variant-closed</v-icon>
        Current Inventory Status
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
      
      <v-data-table
        :headers="headers"
        :items="ingredients"
        :search="search"
        :loading="loading"
        loading-text="Loading inventory data..."
        no-data-text="No ingredients found"
        item-key="id"
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
    </v-card>
    
    <!-- Usage Trends Chart -->
    <v-card>
      <v-card-title>
        <v-icon left>mdi-chart-line</v-icon>
        Ingredient Usage Trends
      </v-card-title>
      <v-card-text>
        <div class="chart-container" style="position: relative; height: 300px;">
          <!-- Chart will be rendered here -->
          <p v-if="loading" class="text-center">Loading chart data...</p>
          <p v-else-if="!hasChartData" class="text-center">
            Not enough data to display usage trends.
          </p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, onUnmounted } from 'vue'
import { db, type Ingredient } from '../services/database'
import { format } from 'date-fns'

export default defineComponent({
  name: 'DashboardView',
  
  setup() {
    const search = ref('')
    const loading = ref(true)
    const ingredients = ref<Ingredient[]>([])
    
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Current Quantity', value: 'current_quantity' },
      { text: 'Min Quantity', value: 'min_quantity' },
      { text: 'Unit', value: 'unit' },
      { text: 'Last Updated', value: 'last_updated' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    const hasChartData = computed(() => ingredients.value.length > 0)
    
    // Fetch ingredients data
    const fetchIngredients = () => {
      loading.value = true
      
      try {
        ingredients.value = db.getAll<'ingredients'>('ingredients')
          .sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Error fetching ingredients:', error)
      } finally {
        loading.value = false
      }
    }
    
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
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'ingredients') {
          if (action === 'insert') {
            ingredients.value.push(item as Ingredient)
          } else if (action === 'update') {
            const index = ingredients.value.findIndex(i => i.id === (item as Ingredient).id)
            if (index !== -1) {
              ingredients.value[index] = item as Ingredient
            }
          } else if (action === 'delete') {
            const index = ingredients.value.findIndex(i => i.id === (item as Ingredient).id)
            if (index !== -1) {
              ingredients.value.splice(index, 1)
            }
          }
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
      search,
      loading,
      ingredients,
      headers,
      hasChartData,
      formatDate,
      getQuantityColor
    }
  }
})
</script>

<style scoped>
.action-card {
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 1.25rem;
  padding-bottom: 8px;
}

.action-text {
  flex-grow: 1;
  display: flex;
  align-items: center;
}
</style>