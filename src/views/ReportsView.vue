<template>
  <div>
    <h1 class="text-h4 mb-4">Reports</h1>
    <reports-generator />
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