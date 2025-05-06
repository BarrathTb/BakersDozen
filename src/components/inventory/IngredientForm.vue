<template>
  <v-form ref="form" @submit.prevent="saveIngredient">
    <v-text-field v-model="ingredient.name" label="Ingredient Name" required></v-text-field>

    <v-text-field
      v-model.number="ingredient.current_quantity"
      label="Current Quantity"
      type="number"
      required
    ></v-text-field>

    <v-text-field
      v-model="ingredient.unit"
      label="Unit (e.g., kg, lbs, pcs)"
      required
    ></v-text-field>

    <v-text-field
      v-model.number="ingredient.min_quantity"
      label="Minimum Quantity"
      type="number"
      required
    ></v-text-field>

    <v-btn color="primary" type="submit" class="mr-4">Save Ingredient</v-btn>
    <v-btn color="secondary" @click="cancel">Cancel</v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../services/database'

const router = useRouter()

const ingredient = ref({
  name: '',
  current_quantity: 0,
  unit: '',
  min_quantity: 0,
})

const emit = defineEmits(['ingredient-saved', 'cancel'])

const saveIngredient = async () => {
  // Basic validation (can be enhanced later)
  if (!ingredient.value.name || !ingredient.value.unit) {
    alert('Please fill in all required fields.')
    return
  }

  try {
    // Assuming 'ingredients' is the correct table name
    await db.insert('ingredients', ingredient.value)
    console.log('Ingredient saved successfully!')
    emit('ingredient-saved') // Emit event on successful save
  } catch (error) {
    console.error('Error saving ingredient:', error)
    alert('Failed to save ingredient. Please try again.')
  }
}

const cancel = () => {
  emit('cancel') // Emit cancel event
}
</script>

<style scoped>
/* Component styles will go here */
</style>
