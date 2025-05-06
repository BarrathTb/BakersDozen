<template>
  <div>
    <h1 class="text-h4 mb-4">Dashboard</h1>

    <!-- Quick Action Cards -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4 action-card" height="150" color="primary" dark to="/deliveries/new">
          <v-card-title class="action-title">
            <v-icon left size="24" class="mr-2">mdi-truck-delivery</v-icon>
            New Delivery
          </v-card-title>
          <v-card-text class="action-text"> Record a new ingredient delivery </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4 action-card" height="150" color="secondary" dark to="/removals/new">
          <v-card-title class="action-title">
            <v-icon left size="24" class="mr-2">mdi-minus-circle</v-icon>
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
            <v-icon left size="24" class="mr-2">mdi-bread-slice</v-icon>
            New Bake
          </v-card-title>
          <v-card-text class="action-text"> Record a new bake and update inventory </v-card-text>
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

      <v-card-text>
        <v-data-table
          v-if="viewType === 'table'"
          :headers="headers"
          :items="ingredients"
          :search="search"
          :loading="loading"
          loading-text="Loading inventory data..."
          no-data-text="No ingredients found"
          item-key="id"
          :sort-by="[{ key: 'name' }]"
        >
          <template v-slot:[`item.current_quantity`]="{ item }">
            <v-chip
              :color="getQuantityColor(item.current_quantity, item.min_quantity)"
              text-color="white"
              small
            >
              {{ item.current_quantity }} {{ item.unit }}
            </v-chip>
          </template>

          <template v-slot:[`item.last_updated`]="{ item }">
            {{ formatDate(item.last_updated) }}
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-btn icon small color="primary" :to="`/inventory/${item.id}`" title="View Details">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <!-- Grid View -->
        <v-row v-else-if="viewType === 'grid'" class="mt-4">
          <v-col
            v-for="ingredient in ingredients"
            :key="ingredient.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <inventory-card :ingredient="ingredient" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Usage Trends Chart -->
    <v-card>
      <v-card-title>
        <v-icon left>mdi-chart-line</v-icon>
        Ingredient Usage Trends
      </v-card-title>
      <v-card-text>
        <div class="chart-container" style="position: relative; height: 300px">
          <p v-if="loading" class="text-center">Loading chart data...</p>
          <p v-else-if="!hasChartData" class="text-center">
            Not enough data to display usage trends.
          </p>
          <apexchart
            v-else
            :key="chartKey"
            type="bar"
            height="300"
            :options="chartOptions"
            :series="chartSeries"
          ></apexchart>
        </div>
      </v-card-text>
    </v-card>

    <!-- Inventory Summary Cards -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-card class="summary-card">
          <v-card-title class="summary-title">
            <v-icon left color="primary" size="24" class="mr-2">mdi-counter</v-icon>
            Total Ingredients
          </v-card-title>
          <v-card-text class="text-center">
            <span class="text-h3 font-weight-bold">{{ ingredients.length }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="summary-card">
          <v-card-title class="summary-title">
            <v-icon left color="warning" size="24" class="mr-2">mdi-alert</v-icon>
            Low Stock Items
          </v-card-title>
          <v-card-text class="text-center">
            <span class="text-h3 font-weight-bold">{{ lowStockCount }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="summary-card">
          <v-card-title class="summary-title">
            <v-icon left color="error" size="24" class="mr-2">mdi-package-variant-remove</v-icon>
            Out of Stock
          </v-card-title>
          <v-card-text class="text-center">
            <span class="text-h3 font-weight-bold">{{ outOfStockCount }}</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { format, subDays } from 'date-fns'
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { VueApexCharts } from 'vue3-apexCharts'
import { useDisplay } from 'vuetify' // Import useDisplay
import InventoryCard from '../components/inventory/InventoryCard.vue' // Import InventoryCard
import { db, type Ingredient } from '../services/database'
import { supabase } from '../services/supabase'

export default defineComponent({
  name: 'DashboardView',
  components: {
    apexchart: VueApexCharts,
    InventoryCard, // Add InventoryCard component
  },

  setup() {
    const session = ref()
    const search = ref('')
    const loading = ref(true)
    const ingredients = ref<Ingredient[]>([])
    const chartKey = ref(0)
    const display = useDisplay() // Use the display composable
    const viewType = ref(display.smAndDown.value ? 'grid' : 'table') // Initialize viewType based on screen size

    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Current Quantity', value: 'current_quantity' },
      { text: 'Min Quantity', value: 'min_quantity' },
      { text: 'Unit', value: 'unit' },
      { text: 'Last Updated', value: 'last_updated' },
      { text: 'Actions', value: 'actions', sortable: false },
    ]

    const hasChartData = computed(() => ingredients.value.length > 0)

    // Chart data and options
    interface ChartSeries {
      name: string
      data: Array<{ x: number; y: number }>
    }
    const chartSeries = ref<ChartSeries[]>([])
    const chartOptions = ref({
      chart: {
        id: 'ingredient-usage',
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
        foreColor: '#ffffff', // Sets all text in chart to white
      },
      colors: ['#3CBFB4', '#E78B35', '#4C9CB0', '#4CAF50'],
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'MMM dd',
        },
      },
      yaxis: {
        title: {
          text: 'Quantity Used - Kg',
        },
      },
      tooltip: {
        theme: 'dark', // This sets tooltip to dark theme (black background, white text)
        x: {
          format: 'MMM dd, yyyy',
        },
        style: {
          fontSize: '12px',
          fontFamily: undefined,
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          opacity: 0.8,
          borderColor: '#000000',
        },
      },
      legend: {
        position: 'top',
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        borderColor: '#e0e0e0',
        row: {
          colors: ['transparent'],
          opacity: 0.5,
        },
      },
      theme: {
        mode: 'dark', // Sets the overall theme to dark
        palette: 'palette1',
      },
    })

    // Summary metrics
    const lowStockCount = computed(() => {
      return ingredients.value.filter(
        (i) => i.current_quantity > 0 && i.current_quantity <= i.min_quantity,
      ).length
    })

    const outOfStockCount = computed(() => {
      return ingredients.value.filter((i) => i.current_quantity <= 0).length
    })

    // Fetch ingredients data
    const fetchIngredients = async () => {
      loading.value = true

      try {
        ingredients.value = await db.getAll<'ingredients'>('ingredients')
        ingredients.value.sort((a, b) => a.name.localeCompare(b.name))
        generateChartData()
      } catch (error) {
        console.error('Error fetching ingredients:', error)
      } finally {
        loading.value = false
      }
    }

    // Generate chart data from ingredients
    const generateChartData = async () => {
      try {
        // For demo purposes, we'll create sample usage data
        // In a real app, you would fetch this from your database
        const today = new Date()
        const topIngredients = ingredients.value.slice(0, 4)

        const newSeries = topIngredients.map((ingredient) => {
          // Generate random usage data for the past 30 days
          const data = Array.from({ length: 30 }, (_, i) => {
            const date = subDays(today, 29 - i)
            // Random usage between 0 and 10
            const usage = Math.floor(Math.random() * 10)
            return {
              x: date.getTime(),
              y: usage,
            }
          })

          return {
            name: ingredient.name,
            data: data,
          }
        })

        chartSeries.value = newSeries
        chartKey.value++ // Force re-render of chart
      } catch (error) {
        console.error('Error generating chart data:', error)
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
            generateChartData()
          } else if (action === 'update') {
            const index = ingredients.value.findIndex((i) => i.id === (item as Ingredient).id)
            if (index !== -1) {
              ingredients.value[index] = item as Ingredient
              generateChartData()
            }
          } else if (action === 'delete') {
            const index = ingredients.value.findIndex((i) => i.id === (item as Ingredient).id)
            if (index !== -1) {
              ingredients.value.splice(index, 1)
              generateChartData()
            }
          }
        }
      })
    }

    onMounted(() => {
      fetchIngredients()
      setupSubscription()
      supabase.auth.getSession().then(({ data }) => {
        session.value = data.session
      })
      supabase.auth.onAuthStateChange((_, _session) => {
        session.value = _session
      })
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
      getQuantityColor,
      chartOptions,
      chartSeries,
      chartKey,
      lowStockCount,
      outOfStockCount,
      display, // Expose display
      viewType, // Expose viewType
    }
  },
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

.summary-card {
  height: 150px;
  display: flex;
  flex-direction: column;
}

.summary-title {
  font-size: 1.1rem;
  padding-bottom: 0;
}
</style>
