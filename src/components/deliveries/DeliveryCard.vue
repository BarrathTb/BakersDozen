<template>
  <v-card>
    <v-card-title>{{ delivery.supplier }}</v-card-title>
    <v-card-text>
      <div>Date: {{ formatDate(delivery.delivery_date) }}</div>
      <div>Items: {{ delivery.item_count }}</div>
      <div>Received By: {{ delivery.created_by_email }}</div>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn small color="primary" @click="$emit('view-details', delivery)">
        <v-icon left>mdi-eye</v-icon>
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { format } from 'date-fns'

interface Delivery {
  id: string
  delivery_date: string
  supplier: string
  item_count: number
  created_by: string
  created_at: string
  created_by_email?: string
}

export default defineComponent({
  name: 'DeliveryCard',
  props: {
    delivery: {
      type: Object as PropType<Delivery>,
      required: true,
    },
  },
  setup() {
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy')
    }

    return {
      formatDate,
    }
  },
})
</script>

<style scoped>
/* Add any specific styles for the card here */
</style>
