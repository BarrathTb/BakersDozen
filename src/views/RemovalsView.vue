<template>
  <div>
    <h1 class="text-h4 mb-4">Ingredient Removals</h1>
    
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between">
        <div>
          <v-icon left>mdi-minus-circle</v-icon>
          Removal History
        </div>
        <v-btn
          color="primary"
          to="/removals/new"
        >
          <v-icon left>mdi-plus</v-icon>
          New Removal
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="removals"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
          :sort-by="[{ key: 'removal_date', order: 'desc' }]"
        >
          <template v-slot:item.removal_date="{ item }">
            {{ formatDate(item.removal_date) }}
          </template>
          
          <template v-slot:item.reason="{ item }">
            <v-chip
              :color="getReasonColor(item.reason)"
              text-color="white"
              small
            >
              {{ item.reason }}
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
    
    <!-- Removal Details Dialog -->
    <v-dialog
      v-model="detailsDialog"
      max-width="800px"
    >
      <v-card v-if="selectedRemoval">
        <v-card-title>
          <v-icon left>mdi-minus-circle</v-icon>
          Removal Details
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <strong>Date:</strong> {{ formatDate(selectedRemoval.removal_date) }}
            </v-col>
            <v-col cols="12" md="4">
              <strong>Reason:</strong> 
              <v-chip
                :color="getReasonColor(selectedRemoval.reason)"
                text-color="white"
                small
                class="ml-2"
              >
                {{ selectedRemoval.reason }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="4">
              <strong>Created By:</strong> {{ selectedRemoval.created_by_email }}
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-h6 mb-3">Removed Items</h3>
          
          <v-data-table
            :headers="itemHeaders"
            :items="removalItems"
            :loading="loadingItems"
            hide-default-footer
            class="elevation-1"
          >
            <template v-slot:item.quantity="{ item }">
              {{ item.quantity }} {{ item.unit }}
            </template>
          </v-data-table>
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
import { db, type Removal, type RemovalItem, type User, type Ingredient } from '../services/database'

export default defineComponent({
  name: 'RemovalsView',
  
  setup() {
    const loading = ref(true)
    const removals = ref<any[]>([])
    const detailsDialog = ref(false)
    const selectedRemoval = ref<any>(null)
    const removalItems = ref<any[]>([])
    const loadingItems = ref(false)
    
    const headers = [
      { text: 'Date', value: 'removal_date' },
      { text: 'Reason', value: 'reason' },
      { text: 'Created By', value: 'created_by_email' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    const itemHeaders = [
      { text: 'Ingredient', value: 'name' },
      { text: 'Quantity', value: 'quantity' },
      { text: 'Unit Cost', value: 'unit_cost' },
      { text: 'Total Cost', value: 'total_cost' }
    ]
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }
    
    // Get color for removal reason
    const getReasonColor = (reason: string) => {
      switch (reason) {
        case 'waste':
          return 'error'
        case 'sale':
          return 'success'
        case 'transfer':
          return 'info'
        default:
          return 'grey'
      }
    }
    
    // Fetch removals
    const fetchRemovals = async () => {
      loading.value = true
      
      try {
        const removalData = await db.getAll<'removals'>('removals')
        removalData.sort((a, b) => new Date(b.removal_date).getTime() - new Date(a.removal_date).getTime())
        
        // Get user data for each removal
        const users = await db.getAll<'users'>('users')
        
        // Transform data
        removals.value = removalData.map(item => {
          const user = users.find(u => u.id === item.created_by)
          return {
            id: item.id,
            removal_date: item.removal_date,
            reason: item.reason,
            created_by: item.created_by,
            created_by_email: user?.email || 'Unknown'
          }
        })
      } catch (error) {
        console.error('Error fetching removals:', error)
      } finally {
        loading.value = false
      }
    }
    
    // View removal details
    const viewDetails = (removal: any) => {
      selectedRemoval.value = removal
      detailsDialog.value = true
      
      fetchRemovalItems(removal.id)
    }
    
    // Fetch removal items
    const fetchRemovalItems = async (removalId: string) => {
      loadingItems.value = true
      
      try {
        const removalItemsData = await db.query<'removal_items'>('removal_items', 
          item => item.removal_id === removalId
        )
        
        const ingredients = await db.getAll<'ingredients'>('ingredients')
        
        // Transform data
        removalItems.value = removalItemsData.map(item => {
          const ingredient = ingredients.find(i => i.id === item.ingredient_id)
          return {
            id: item.id,
            name: ingredient?.name || 'Unknown',
            quantity: item.quantity,
            unit: ingredient?.unit || '',
            // Dummy cost values - in a real app these would come from the database
            unit_cost: '$2.50',
            total_cost: `$${(item.quantity * 2.5).toFixed(2)}`
          }
        })
      } catch (error) {
        console.error('Error fetching removal items:', error)
      } finally {
        loadingItems.value = false
      }
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'removals') {
          fetchRemovals()
        } else if (table === 'removal_items' && selectedRemoval.value) {
          fetchRemovalItems(selectedRemoval.value.id)
        }
      })
    }
    
    onMounted(() => {
      fetchRemovals()
      setupSubscription()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      loading,
      removals,
      headers,
      detailsDialog,
      selectedRemoval,
      removalItems,
      loadingItems,
      itemHeaders,
      formatDate,
      getReasonColor,
      viewDetails
    }
  }
})
</script>