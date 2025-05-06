<template>
  <v-card>
    <v-card-title>Removal</v-card-title>
    <v-card-text>
      <div>Date: {{ formatDate(removal.removal_date) }}</div>
      <div>
        Reason:
        <v-chip :color="getReasonColor(removal.reason)" text-color="white" small class="ml-2">
          {{ removal.reason }}
        </v-chip>
      </div>
      <div>Created By: {{ removal.created_by_email }}</div>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn small color="primary" @click="$emit('view-details', removal)">
        <v-icon left>mdi-eye</v-icon>
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { format } from 'date-fns'

interface Removal {
  id: string
  removal_date: string
  reason: string
  created_by: string
  created_by_email: string
}

export default defineComponent({
  name: 'RemovalCard',
  props: {
    removal: {
      type: Object as PropType<Removal>,
      required: true,
    },
  },
  setup() {
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }

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

    return {
      formatDate,
      getReasonColor,
    }
  },
})
</script>

<style scoped>
/* Add any specific styles for the card here */
</style>
