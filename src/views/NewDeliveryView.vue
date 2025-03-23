<template>
  <div>
    <h1 class="text-h4 mb-4">New Delivery</h1>
    <delivery-form @delivery-saved="onDeliverySaved" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import DeliveryForm from '../components/inventory/DeliveryForm.vue'

export default defineComponent({
  name: 'NewDeliveryView',
  
  components: {
    DeliveryForm
  },
  
  setup() {
    const router = useRouter()
    
    const onDeliverySaved = (deliveryId: string) => {
      // Navigate to deliveries list after successful save
      setTimeout(() => {
        router.push('/deliveries')
      }, 1500)
    }
    
    return {
      onDeliverySaved
    }
  }
})
</script>