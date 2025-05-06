<template>
  <v-card>
    <v-card-title>{{ bake.recipe_name }}</v-card-title>
    <v-card-text>
      <div>Date: {{ formatDate(bake.bake_date) }}</div>
      <div>Baker: {{ bake.created_by_email }}</div>
      <div>
        Efficiency:
        <v-chip :color="getEfficiencyColor(bake.efficiency)" text-color="white" small class="ml-2">
          {{ bake.efficiency.toFixed(1) }}%
        </v-chip>
      </div>
      <div>Expected Yield: {{ bake.expected_yield }}</div>
      <div>Actual Yield: {{ bake.actual_yield }}</div>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn small color="primary" @click="$emit('view-details', bake)">
        <v-icon left>mdi-eye</v-icon>
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { format } from 'date-fns'

interface Bake {
  id: string
  bake_date: string
  recipe_id: string
  recipe_name: string
  expected_yield: number
  actual_yield: number
  efficiency: number
  notes?: string
  created_by: string
  created_by_email: string
  created_at: string
}

export default defineComponent({
  name: 'BakeCard',
  props: {
    bake: {
      type: Object as PropType<Bake>,
      required: true,
    },
  },
  setup() {
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }

    const getEfficiencyColor = (efficiency: number) => {
      if (efficiency >= 100) return 'success'
      if (efficiency >= 90) return 'info'
      if (efficiency >= 75) return 'warning'
      return 'error'
    }

    return {
      formatDate,
      getEfficiencyColor,
    }
  },
})
</script>

<style scoped>
/* Add any specific styles for the card here */
</style>
