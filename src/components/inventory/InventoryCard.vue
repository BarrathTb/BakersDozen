<template>
  <v-card :class="{ 'low-stock': isLowStock, 'out-of-stock': isOutOfStock }">
    <v-card-title class="d-flex justify-space-between">
      <span>{{ ingredient.name }}</span>
      <v-chip
        :color="quantityColor"
        text-color="white"
        small
      >
        {{ ingredient.current_quantity }} {{ ingredient.unit }}
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="6">
          <div class="text-caption text-grey">Minimum Level</div>
          <div>{{ ingredient.min_quantity }} {{ ingredient.unit }}</div>
        </v-col>
        <v-col cols="6">
          <div class="text-caption text-grey">Last Updated</div>
          <div>{{ formattedDate }}</div>
        </v-col>
      </v-row>
      
      <v-progress-linear
        :value="stockPercentage"
        :color="quantityColor"
        height="10"
        class="mt-2"
      ></v-progress-linear>
      
      <div class="mt-2 text-caption" v-if="isLowStock">
        <v-icon small color="warning">mdi-alert</v-icon>
        Low stock level
      </div>
      <div class="mt-2 text-caption" v-if="isOutOfStock">
        <v-icon small color="error">mdi-alert-circle</v-icon>
        Out of stock
      </div>
    </v-card-text>
    
    <v-divider></v-divider>
    
    <v-card-actions>
      <v-btn
        text
        small
        color="primary"
        :to="`/inventory/${ingredient.id}`"
      >
        <v-icon left small>mdi-eye</v-icon>
        Details
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        text
        small
        color="secondary"
        @click="$emit('add-to-delivery')"
      >
        <v-icon left small>mdi-plus</v-icon>
        Add to Delivery
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import type { PropType } from 'vue'
import { format } from 'date-fns'

interface Ingredient {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  last_updated: string
}

export default defineComponent({
  name: 'InventoryCard',
  
  props: {
    ingredient: {
      type: Object as PropType<Ingredient>,
      required: true
    }
  },
  
  emits: ['add-to-delivery'],
  
  setup(props) {
    // Format the date
    const formattedDate = computed(() => {
      return format(new Date(props.ingredient.last_updated), 'MMM d, yyyy')
    })
    
    // Calculate if the ingredient is low on stock
    const isLowStock = computed(() => {
      return (
        props.ingredient.current_quantity > 0 &&
        props.ingredient.current_quantity <= props.ingredient.min_quantity
      )
    })
    
    // Calculate if the ingredient is out of stock
    const isOutOfStock = computed(() => {
      return props.ingredient.current_quantity <= 0
    })
    
    // Determine the color based on stock level
    const quantityColor = computed(() => {
      if (isOutOfStock.value) return 'error'
      if (isLowStock.value) return 'warning'
      return 'success'
    })
    
    // Calculate stock percentage for progress bar
    const stockPercentage = computed(() => {
      if (props.ingredient.min_quantity === 0) return 100
      
      // Calculate percentage relative to minimum quantity (200% means twice the minimum)
      const percentage = (props.ingredient.current_quantity / props.ingredient.min_quantity) * 100
      
      // Cap at 100% for the progress bar
      return Math.min(percentage, 100)
    })
    
    return {
      formattedDate,
      isLowStock,
      isOutOfStock,
      quantityColor,
      stockPercentage
    }
  }
})
</script>

<style scoped>
.low-stock {
  border-left: 4px solid var(--v-warning-base);
}

.out-of-stock {
  border-left: 4px solid var(--v-error-base);
}
</style>