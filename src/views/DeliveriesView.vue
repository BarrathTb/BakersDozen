<template>
  <div>
    <h1 class="text-h4 mb-4">Ingredient Deliveries</h1>
    
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between">
        <div>
          <v-icon left>mdi-truck-delivery</v-icon>
          Delivery History
        </div>
        <v-btn
          color="primary"
          to="/deliveries/new"
        >
          <v-icon left>mdi-plus</v-icon>
          New Delivery
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="deliveries"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
          :sort-by="[{ key: 'delivery_date', order: 'desc' }]"
        >
          <template v-slot:item.delivery_date="{ item }">
            {{ formatDate(item.delivery_date) }}
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
    
    <!-- Delivery Details Dialog -->
    <v-dialog
      v-model="detailsDialog"
      max-width="800px"
    >
      <v-card v-if="selectedDelivery">
        <v-card-title>
          <v-icon left>mdi-truck-delivery</v-icon>
          Delivery Details
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <strong>Date:</strong> {{ formatDate(selectedDelivery.delivery_date) }}
            </v-col>
            <v-col cols="12" md="4">
              <strong>Supplier:</strong> {{ selectedDelivery.supplier }}
            </v-col>
            <v-col cols="12" md="4">
              <strong>Received By:</strong> {{ selectedDelivery.created_by_email }}
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-h6 mb-3">Delivered Items</h3>
          
          <v-data-table
            :headers="itemHeaders"
            :items="deliveryItems"
            :loading="loadingItems"
            hide-default-footer
            class="elevation-1"
            :sort-by="[{ key: 'name' }]"
          >
            <template v-slot:item.quantity="{ item }">
              {{ item.quantity }} {{ item.unit }}
            </template>
            
            <template v-slot:item.expiry_date="{ item }">
              {{ formatDate(item.expiry_date) }}
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
import { db } from '../services/database'

interface Delivery {
  id: string
  delivery_date: string
  supplier: string
  created_by: string
  created_at: string
}

interface DeliveryItem {
  id: string
  delivery_id: string
  ingredient_id: string
  quantity: number
  batch_number: string
  expiry_date: string
}

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export default defineComponent({
  name: 'DeliveriesView',
  
  setup() {
    const loading = ref(true)
    const deliveries = ref<any[]>([])
    const detailsDialog = ref(false)
    const selectedDelivery = ref<any>(null)
    const deliveryItems = ref<any[]>([])
    const loadingItems = ref(false)
    
    const headers = [
      { text: 'Date', value: 'delivery_date' },
      { text: 'Supplier', value: 'supplier' },
      { text: 'Items', value: 'item_count' },
      { text: 'Received By', value: 'created_by_email' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    const itemHeaders = [
      { text: 'Ingredient', value: 'name' },
      { text: 'Quantity', value: 'quantity' },
      { text: 'Batch Number', value: 'batch_number' },
      { text: 'Expiry Date', value: 'expiry_date' }
    ]
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy')
    }
    
    // Fetch deliveries
    const fetchDeliveries = () => {
      loading.value = true
      
      try {
        const deliveriesData = db.getAll<'deliveries'>('deliveries')
          .sort((a, b) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime())
        
        const deliveryItemsData = db.getAll<'delivery_items'>('delivery_items')
        const users = db.getAll<'users'>('users')
        
        // Count items per delivery
        const itemCounts: Record<string, number> = {}
        deliveryItemsData.forEach(item => {
          itemCounts[item.delivery_id] = (itemCounts[item.delivery_id] || 0) + 1
        })
        
        // Transform data
        deliveries.value = deliveriesData.map(item => {
          const user = users.find(u => u.id === item.created_by)
          
          return {
            id: item.id,
            delivery_date: item.delivery_date,
            supplier: item.supplier,
            item_count: itemCounts[item.id] || 0,
            created_by: item.created_by,
            created_by_email: user?.email || 'Unknown'
          }
        })
      } catch (error) {
        console.error('Error fetching deliveries:', error)
      } finally {
        loading.value = false
      }
    }
    
    // View delivery details
    const viewDetails = (delivery: any) => {
      selectedDelivery.value = delivery
      detailsDialog.value = true
      
      fetchDeliveryItems(delivery.id)
    }
    
    // Fetch delivery items
    const fetchDeliveryItems = (deliveryId: string) => {
      loadingItems.value = true
      
      try {
        const deliveryItemsData = db.query<'delivery_items'>('delivery_items', 
          item => item.delivery_id === deliveryId
        )
        
        const ingredients = db.getAll<'ingredients'>('ingredients')
        
        // Transform data
        deliveryItems.value = deliveryItemsData.map(item => {
          const ingredient = ingredients.find(i => i.id === item.ingredient_id)
          
          if (!ingredient) {
            return {
              id: item.id,
              name: 'Unknown Ingredient',
              quantity: item.quantity,
              unit: '',
              batch_number: item.batch_number,
              expiry_date: item.expiry_date
            }
          }
          
          return {
            id: item.id,
            name: ingredient.name,
            quantity: item.quantity,
            unit: ingredient.unit,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date
          }
        })
      } catch (error) {
        console.error('Error fetching delivery items:', error)
      } finally {
        loadingItems.value = false
      }
    }
    
    // Set up subscription for real-time updates
    let unsubscribe: (() => void) | null = null
    
    const setupSubscription = () => {
      unsubscribe = db.subscribe((table, action, item) => {
        if (table === 'deliveries' || table === 'delivery_items' || table === 'users') {
          fetchDeliveries()
        }
        
        if (table === 'delivery_items' && selectedDelivery.value && 
            action === 'insert' && (item as DeliveryItem).delivery_id === selectedDelivery.value.id) {
          fetchDeliveryItems(selectedDelivery.value.id)
        }
      })
    }
    
    onMounted(() => {
      fetchDeliveries()
      setupSubscription()
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      loading,
      deliveries,
      headers,
      detailsDialog,
      selectedDelivery,
      deliveryItems,
      loadingItems,
      itemHeaders,
      formatDate,
      viewDetails
    }
  }
})
</script>