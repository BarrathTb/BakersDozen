<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">Reports</h1>
          <p class="text-subtitle-1 mb-6">Generate and download reports for inventory movement, waste tracking, and production efficiency.</p>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12">
          <reports-generator />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ReportsGenerator from '../components/reports/ReportsGenerator.vue'

export default defineComponent({
  name: 'ReportsView',
  
  components: {
    ReportsGenerator
  }
})
</script>