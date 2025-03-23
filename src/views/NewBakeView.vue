<template>
  <div>
    <h1 class="text-h4 mb-4">New Bake</h1>
    <bake-tracker @bake-saved="onBakeSaved" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import BakeTracker from '../components/inventory/BakeTracker.vue'

export default defineComponent({
  name: 'NewBakeView',
  
  components: {
    BakeTracker
  },
  
  setup() {
    const router = useRouter()
    
    const onBakeSaved = (bakeId: string) => {
      // Navigate to bakes list after successful save
      setTimeout(() => {
        router.push('/bakes')
      }, 1500)
    }
    
    return {
      onBakeSaved
    }
  }
})
</script>