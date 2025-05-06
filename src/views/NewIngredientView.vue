<template>
  <div>
    <h1>New Ingredient</h1>
    <v-card>
      <v-card-title>Add New Ingredient</v-card-title>
      <v-card-text>
        <ingredient-form @ingredient-saved="onIngredientSaved" @cancel="onCancel" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import IngredientForm from '../components/inventory/IngredientForm.vue'

const router = useRouter()

const onIngredientSaved = () => {
  console.log('Ingredient saved successfully (from view)!')
  router.push({ name: 'inventory' }) // Navigate back to inventory
}

const onCancel = () => {
  console.log('Ingredient form cancelled (from view).')
  router.push({ name: 'inventory' }) // Navigate back to inventory
}
</script>

<style scoped>
/* Component styles will go here */
</style>
