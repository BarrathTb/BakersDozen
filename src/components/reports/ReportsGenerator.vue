<template>
  <div>
    <v-card>
      <v-card-title>
        <v-icon left>mdi-file-chart</v-icon>
        Generate Reports
      </v-card-title>
      
      <v-card-text>
        <v-form ref="form" v-model="isFormValid">
          <!-- Report Type Selection -->
          <v-select
            v-model="reportType"
            :items="reportTypes"
            label="Report Type"
            :rules="[v => !!v || 'Report type is required']"
            required
            @change="resetResults"
          ></v-select>
          
          <!-- Date Range Selection -->
          <v-row>
            <v-col cols="12" md="6">
              <v-menu
                ref="startDateMenu"
                v-model="startDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="startDate"
                    label="Start Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    :rules="[v => !!v || 'Start date is required']"
                    required
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="startDate"
                  @input="startDateMenu = false"
                  :max="endDate || new Date().toISOString().substr(0, 10)"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" md="6">
              <v-menu
                ref="endDateMenu"
                v-model="endDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="endDate"
                    label="End Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    :rules="[
                      v => !!v || 'End date is required',
                      v => !startDate || new Date(v) >= new Date(startDate) || 'End date must be after start date'
                    ]"
                    required
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="endDate"
                  @input="endDateMenu = false"
                  :min="startDate"
                  :max="new Date().toISOString().substr(0, 10)"
                ></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>
          
          <!-- Additional Filters -->
          <div v-if="reportType === 'inventory-movement'">
            <v-autocomplete
              v-model="selectedIngredients"
              :items="ingredients"
              item-text="name"
              item-value="id"
              label="Filter by Ingredients (Optional)"
              multiple
              chips
              small-chips
              deletable-chips
            ></v-autocomplete>
          </div>
          
          <div v-if="reportType === 'waste-tracking'">
            <v-checkbox
              v-model="includeCharts"
              label="Include charts and visualizations"
            ></v-checkbox>
          </div>
          
          <div v-if="reportType === 'production-efficiency'">
            <v-autocomplete
              v-model="selectedRecipes"
              :items="recipes"
              item-text="name"
              item-value="id"
              label="Filter by Recipes (Optional)"
              multiple
              chips
              small-chips
              deletable-chips
            ></v-autocomplete>
            
            <v-checkbox
              v-model="includeCharts"
              label="Include charts and visualizations"
            ></v-checkbox>
          </div>
          
          <!-- Email Options -->
          <v-checkbox
            v-model="sendEmail"
            label="Email report to administrators"
          ></v-checkbox>
          
          <v-text-field
            v-if="sendEmail"
            v-model="emailSubject"
            label="Email Subject"
            :rules="[v => !!v || 'Email subject is required']"
            required
          ></v-text-field>
          
          <!-- Generate Button -->
          <v-btn
            color="primary"
            :loading="loading"
            :disabled="!isFormValid || loading"
            @click="generateReport"
            class="mt-4"
          >
            <v-icon left>mdi-file-chart</v-icon>
            Generate Report
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    
    <!-- Report Results -->
    <v-card v-if="reportData.length > 0" class="mt-4">
      <v-card-title class="d-flex justify-space-between">
        <div>
          <v-icon left>mdi-file-document</v-icon>
          Report Results
        </div>
        <div>
          <v-btn
            color="primary"
            text
            @click="downloadCSV"
            :disabled="loading"
          >
            <v-icon left>mdi-download</v-icon>
            Download CSV
          </v-btn>
        </div>
      </v-card-title>
      
      <v-card-text>
        <!-- Inventory Movement Report -->
        <div v-if="reportType === 'inventory-movement'">
          <v-data-table
            :headers="inventoryMovementHeaders"
            :items="reportData"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
            :sort-by="[{ key: 'date' }]"
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
                {{ item.type === 'delivery' ? '+' : '-' }}{{ item.quantity }} {{ item.unit }}
              </span>
            </template>
          </v-data-table>
        </div>
        
        <!-- Waste Tracking Report -->
        <div v-if="reportType === 'waste-tracking'">
          <v-data-table
            :headers="wasteTrackingHeaders"
            :items="reportData"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
            :sort-by="[{ key: 'date' }]"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            
            <template v-slot:item.quantity="{ item }">
              <span class="error--text">
                {{ item.quantity }} {{ item.unit }}
              </span>
            </template>
            
            <template v-slot:item.cost="{ item }">
              ${{ item.cost.toFixed(2) }}
            </template>
          </v-data-table>
          
          <div v-if="includeCharts" class="mt-4">
            <h3 class="text-h6 mb-2">Waste by Ingredient</h3>
            <div class="chart-container" style="position: relative; height: 300px;">
              <!-- Chart will be rendered here -->
              <p v-if="loading" class="text-center">Loading chart data...</p>
              <p v-else-if="reportData.length === 0" class="text-center">
                No data available for chart.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Production Efficiency Report -->
        <div v-if="reportType === 'production-efficiency'">
          <v-data-table
            :headers="productionEfficiencyHeaders"
            :items="reportData"
            :loading="loading"
            :items-per-page="10"
            class="elevation-1"
            :sort-by="[{ key: 'date' }]"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
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
          </v-data-table>
          
          <div v-if="includeCharts" class="mt-4">
            <h3 class="text-h6 mb-2">Efficiency Trends</h3>
            <div class="chart-container" style="position: relative; height: 300px;">
              <!-- Chart will be rendered here -->
              <p v-if="loading" class="text-center">Loading chart data...</p>
              <p v-else-if="reportData.length === 0" class="text-center">
                No data available for chart.
              </p>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      {{ successMessage }}
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
import { defineComponent, ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { db } from '../../services/database'

export default defineComponent({
  name: 'ReportsGenerator',
  
  setup() {
    const form = ref<any>(null)
    const isFormValid = ref(false)
    const loading = ref(false)
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')
    
    // Report options
    const reportType = ref('')
    const reportTypes = [
      { text: 'Inventory Movement', value: 'inventory-movement' },
      { text: 'Waste Tracking', value: 'waste-tracking' },
      { text: 'Production Efficiency', value: 'production-efficiency' }
    ]
    
    // Date range
    const startDate = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10)) // 30 days ago
    const endDate = ref(new Date().toISOString().substr(0, 10)) // Today
    const startDateMenu = ref(false)
    const endDateMenu = ref(false)
    
    // Filters
    const ingredients = ref<any[]>([])
    const selectedIngredients = ref<string[]>([])
    const recipes = ref<any[]>([])
    const selectedRecipes = ref<string[]>([])
    const includeCharts = ref(true)
    
    // Email options
    const sendEmail = ref(false)
    const emailSubject = ref('')
    
    // Report data
    const reportData = ref<any[]>([])
    
    // Table headers
    const inventoryMovementHeaders = [
      { text: 'Date', value: 'date' },
      { text: 'Ingredient', value: 'ingredient_name' },
      { text: 'Type', value: 'type' },
      { text: 'Quantity', value: 'quantity' },
      { text: 'Batch/Reference', value: 'reference' }
    ]
    
    const wasteTrackingHeaders = [
      { text: 'Date', value: 'date' },
      { text: 'Ingredient', value: 'ingredient_name' },
      { text: 'Quantity', value: 'quantity' },
      { text: 'Cost', value: 'cost' },
      { text: 'Reason', value: 'reason' }
    ]
    
    const productionEfficiencyHeaders = [
      { text: 'Date', value: 'date' },
      { text: 'Recipe', value: 'recipe_name' },
      { text: 'Expected Yield', value: 'expected_yield' },
      { text: 'Actual Yield', value: 'actual_yield' },
      { text: 'Efficiency', value: 'efficiency' }
    ]
    
    // Fetch ingredients and recipes
    const fetchFilterData = () => {
      try {
        // Fetch ingredients
        ingredients.value = db.getAll<'ingredients'>('ingredients')
          .sort((a, b) => a.name.localeCompare(b.name))
        
        // Fetch recipes
        recipes.value = db.getAll<'recipes'>('recipes')
          .sort((a, b) => a.name.localeCompare(b.name))
      } catch (error) {
        console.error('Error fetching filter data:', error)
        showError('Failed to load filter data')
      }
    }
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy')
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
    
    // Get color for efficiency
    const getEfficiencyColor = (efficiency: number) => {
      if (efficiency >= 100) return 'success'
      if (efficiency >= 90) return 'info'
      if (efficiency >= 75) return 'warning'
      return 'error'
    }
    
    // Reset results
    const resetResults = () => {
      reportData.value = []
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }
    
    // Generate report
    const generateReport = async () => {
      if (!isFormValid.value) {
        form.value?.validate()
        return
      }
      
      loading.value = true
      reportData.value = []
      
      try {
        const startDateTime = new Date(startDate.value)
        const endDateTime = new Date(endDate.value)
        endDateTime.setHours(23, 59, 59, 999) // End of day
        
        if (reportType.value === 'inventory-movement') {
          generateInventoryMovementReport(startDateTime, endDateTime)
        } else if (reportType.value === 'waste-tracking') {
          generateWasteTrackingReport(startDateTime, endDateTime)
        } else if (reportType.value === 'production-efficiency') {
          generateProductionEfficiencyReport(startDateTime, endDateTime)
        }
        
        if (sendEmail.value) {
          await sendReportEmail()
        }
        
        successMessage.value = 'Report generated successfully!'
        showSuccessAlert.value = true
      } catch (error: any) {
        console.error('Error generating report:', error)
        showError(error.message || 'Failed to generate report')
      } finally {
        loading.value = false
      }
    }
    
    // Generate inventory movement report
    const generateInventoryMovementReport = (startDateTime: Date, endDateTime: Date) => {
      try {
        // Get deliveries
        const deliveries = db.getAll<'deliveries'>('deliveries')
          .filter(d => {
            const date = new Date(d.delivery_date)
            return date >= startDateTime && date <= endDateTime
          })
        
        const deliveryItems = db.getAll<'delivery_items'>('delivery_items')
        const ingredients = db.getAll<'ingredients'>('ingredients')
        
        // Transform deliveries data
        const deliveryData = deliveryItems
          .filter(item => {
            const delivery = deliveries.find(d => d.id === item.delivery_id)
            if (!delivery) return false
            
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)
            if (!ingredient) return false
            
            // Apply ingredient filter if selected
            if (selectedIngredients.value.length > 0 && !selectedIngredients.value.includes(item.ingredient_id)) {
              return false
            }
            
            return true
          })
          .map(item => {
            const delivery = deliveries.find(d => d.id === item.delivery_id)!
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)!
            
            return {
              date: delivery.delivery_date,
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              type: 'delivery',
              quantity: item.quantity,
              unit: ingredient.unit,
              reference: `Batch: ${item.batch_number}`,
              supplier: delivery.supplier
            }
          })
        
        // Get removals
        const removals = db.getAll<'removals'>('removals')
          .filter(r => {
            const date = new Date(r.removal_date)
            return date >= startDateTime && date <= endDateTime
          })
        
        const removalItems = db.getAll<'removal_items'>('removal_items')
        
        // Transform removals data
        const removalData = removalItems
          .filter(item => {
            const removal = removals.find(r => r.id === item.removal_id)
            if (!removal) return false
            
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)
            if (!ingredient) return false
            
            // Apply ingredient filter if selected
            if (selectedIngredients.value.length > 0 && !selectedIngredients.value.includes(item.ingredient_id)) {
              return false
            }
            
            return true
          })
          .map(item => {
            const removal = removals.find(r => r.id === item.removal_id)!
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)!
            
            return {
              date: removal.removal_date,
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              type: 'removal',
              quantity: item.quantity,
              unit: ingredient.unit,
              reference: `Reason: ${removal.reason}`,
              reason: removal.reason
            }
          })
        
        // Get bakes
        const bakes = db.getAll<'bakes'>('bakes')
          .filter(b => {
            const date = new Date(b.bake_date)
            return date >= startDateTime && date <= endDateTime
          })
        
        const recipes = db.getAll<'recipes'>('recipes')
        const recipeIngredients = db.getAll<'recipe_ingredients'>('recipe_ingredients')
        
        // Transform bakes data
        let bakeData: any[] = []
        
        bakes.forEach(bake => {
          const recipe = recipes.find(r => r.id === bake.recipe_id)
          if (!recipe) return
          
          const recipeIngs = recipeIngredients.filter(ri => ri.recipe_id === recipe.id)
          
          recipeIngs.forEach(ri => {
            const ingredient = ingredients.find(i => i.id === ri.ingredient_id)
            if (!ingredient) return
            
            // Apply ingredient filter if selected
            if (selectedIngredients.value.length > 0 && !selectedIngredients.value.includes(ingredient.id)) {
              return
            }
            
            bakeData.push({
              date: bake.bake_date,
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              type: 'bake',
              quantity: ri.quantity,
              unit: ingredient.unit,
              reference: `Recipe: ${recipe.name}`,
              recipe: recipe.name
            })
          })
        })
        
        // Combine all data and sort by date
        reportData.value = [...deliveryData, ...removalData, ...bakeData]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      } catch (error) {
        console.error('Error generating inventory movement report:', error)
        throw new Error('Failed to generate inventory movement report')
      }
    }
    
    // Generate waste tracking report
    const generateWasteTrackingReport = (startDateTime: Date, endDateTime: Date) => {
      try {
        // Get waste removals
        const removals = db.getAll<'removals'>('removals')
          .filter(r => {
            const date = new Date(r.removal_date)
            return r.reason === 'waste' && date >= startDateTime && date <= endDateTime
          })
        
        const removalItems = db.getAll<'removal_items'>('removal_items')
        const ingredients = db.getAll<'ingredients'>('ingredients')
        
        // Transform data
        reportData.value = removalItems
          .filter(item => {
            const removal = removals.find(r => r.id === item.removal_id)
            if (!removal) return false
            
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)
            if (!ingredient) return false
            
            // Apply ingredient filter if selected
            if (selectedIngredients.value.length > 0 && !selectedIngredients.value.includes(item.ingredient_id)) {
              return false
            }
            
            return true
          })
          .map(item => {
            const removal = removals.find(r => r.id === item.removal_id)!
            const ingredient = ingredients.find(i => i.id === item.ingredient_id)!
            
            return {
              date: removal.removal_date,
              ingredient_id: ingredient.id,
              ingredient_name: ingredient.name,
              quantity: item.quantity,
              unit: ingredient.unit,
              // Dummy cost calculation - in a real app this would use actual costs
              cost: item.quantity * 2.5,
              reason: 'Waste'
            }
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      } catch (error) {
        console.error('Error generating waste tracking report:', error)
        throw new Error('Failed to generate waste tracking report')
      }
    }
    
    // Generate production efficiency report
    const generateProductionEfficiencyReport = (startDateTime: Date, endDateTime: Date) => {
      try {
        // Get bakes
        const bakes = db.getAll<'bakes'>('bakes')
          .filter(b => {
            const date = new Date(b.bake_date)
            return date >= startDateTime && date <= endDateTime
          })
        
        const recipes = db.getAll<'recipes'>('recipes')
        
        // Transform data
        reportData.value = bakes
          .filter(bake => {
            const recipe = recipes.find(r => r.id === bake.recipe_id)
            if (!recipe) return false
            
            // Apply recipe filter if selected
            if (selectedRecipes.value.length > 0 && !selectedRecipes.value.includes(recipe.id)) {
              return false
            }
            
            return true
          })
          .map(bake => {
            const recipe = recipes.find(r => r.id === bake.recipe_id)!
            
            return {
              date: bake.bake_date,
              recipe_id: recipe.id,
              recipe_name: recipe.name,
              expected_yield: recipe.expected_yield,
              actual_yield: bake.actual_yield,
              efficiency: (bake.actual_yield / recipe.expected_yield) * 100
            }
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      } catch (error) {
        console.error('Error generating production efficiency report:', error)
        throw new Error('Failed to generate production efficiency report')
      }
    }
    
    // Send report email
    const sendReportEmail = async () => {
      // In a real application, this would send an email with the report
      // For this demo, we'll just simulate it
      console.log('Sending email with report:', {
        subject: emailSubject.value,
        reportType: reportType.value,
        dateRange: `${startDate.value} to ${endDate.value}`,
        dataCount: reportData.value.length
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    }
    
    // Convert array to CSV
    const arrayToCSV = (data: any[], fields: string[]): string => {
      if (data.length === 0) return ''
      
      // Create header row
      const header = fields.join(',')
      
      // Create data rows
      const rows = data.map(item => {
        return fields.map(field => {
          const value = item[field]
          // Handle special cases (strings with commas, quotes, etc.)
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      })
      
      // Combine header and rows
      return [header, ...rows].join('\n')
    }
    
    // Download CSV
    const downloadCSV = () => {
      try {
        let fields: string[] = []
        
        // Set fields based on report type
        if (reportType.value === 'inventory-movement') {
          fields = ['date', 'ingredient_name', 'type', 'quantity', 'unit', 'reference']
        } else if (reportType.value === 'waste-tracking') {
          fields = ['date', 'ingredient_name', 'quantity', 'unit', 'cost', 'reason']
        } else if (reportType.value === 'production-efficiency') {
          fields = ['date', 'recipe_name', 'expected_yield', 'actual_yield', 'efficiency']
        }
        
        // Create CSV
        const csv = arrayToCSV(reportData.value, fields)
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.setAttribute('hidden', '')
        a.setAttribute('href', url)
        a.setAttribute('download', `${reportType.value}-report-${startDate.value}-to-${endDate.value}.csv`)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (error) {
        console.error('Error downloading CSV:', error)
        showError('Failed to download CSV')
      }
    }
    
    onMounted(() => {
      fetchFilterData()
    })
    
    return {
      form,
      isFormValid,
      loading,
      showSuccessAlert,
      showErrorAlert,
      successMessage,
      errorMessage,
      reportType,
      reportTypes,
      startDate,
      endDate,
      startDateMenu,
      endDateMenu,
      ingredients,
      selectedIngredients,
      recipes,
      selectedRecipes,
      includeCharts,
      sendEmail,
      emailSubject,
      reportData,
      inventoryMovementHeaders,
      wasteTrackingHeaders,
      productionEfficiencyHeaders,
      formatDate,
      getMovementTypeColor,
      getEfficiencyColor,
      resetResults,
      generateReport,
      downloadCSV
    }
  }
})
</script>