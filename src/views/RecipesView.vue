<template>
  <div>
    <h1 class="text-h4 mb-4">Recipes</h1>
    
    <v-card class="mb-4">
      <v-card-title class="d-flex justify-space-between">
        <div>
          <v-icon left>mdi-book-open-variant</v-icon>
          Recipe Library
        </div>
        <v-btn
          color="primary"
          to="/recipes/new"
        >
          <v-icon left>mdi-plus</v-icon>
          New Recipe
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="recipes"
          :loading="loading"
          :search="search"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:top>
            <v-text-field
              v-model="search"
              label="Search Recipes"
              prepend-icon="mdi-magnify"
              class="mx-4 mt-4"
              hide-details
            ></v-text-field>
          </template>
          
          <template v-slot:item.expected_yield="{ item }">
            {{ item.expected_yield }} units
          </template>
          
          <template v-slot:item.ingredient_count="{ item }">
            {{ item.ingredient_count }} ingredients
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              small
              color="primary"
              :to="`/recipes/${item.id}`"
              title="View Details"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              small
              color="secondary"
              @click="startBake(item)"
              title="Start Bake"
            >
              <v-icon>mdi-bread-slice</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- View Toggle -->
    <div class="d-flex justify-end mt-4">
      <v-btn-toggle v-model="viewType" mandatory>
        <v-btn value="table">
          <v-icon>mdi-table</v-icon>
        </v-btn>
        <v-btn value="grid">
          <v-icon>mdi-view-grid</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
    
    <!-- Grid View -->
    <v-row v-if="viewType === 'grid'" class="mt-4">
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card>
          <v-card-title class="text-h6">
            {{ recipe.name }}
          </v-card-title>
          
          <v-card-text>
            <div class="mb-2">
              <v-icon small class="mr-1">mdi-scale</v-icon>
              Expected Yield: {{ recipe.expected_yield }} units
            </div>
            <div>
              <v-icon small class="mr-1">mdi-food-variant</v-icon>
              {{ recipe.ingredient_count }} ingredients
            </div>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions>
            <v-btn
              text
              color="primary"
              :to="`/recipes/${recipe.id}`"
            >
              <v-icon left>mdi-eye</v-icon>
              Details
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="secondary"
              @click="startBake(recipe)"
            >
              <v-icon left>mdi-bread-slice</v-icon>
              Bake
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, type Recipe } from '../services/database'

export default defineComponent({
  name: 'RecipesView',
  
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const recipes = ref<Recipe[]>([])
    const search = ref('')
    const viewType = ref('table')
    
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Expected Yield', value: 'expected_yield' },
      { text: 'Ingredients', value: 'ingredient_count' },
      { text: 'Created By', value: 'created_by_email' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
   
    // Fetch recipes
    // Fetch recipes
    const fetchRecipes = async () => {
      loading.value = true

      try {
        recipes.value = await db.getAll<'recipes'>('recipes')
        recipes.value.sort((a, b) => b.created_at.localeCompare(a.created_at))
      } catch (error) {
        console.error('Error fetching recipes:', error)
      } finally {
        loading.value = false
      }

      // Get ingredient counts for each recipe
      recipes.value.forEach(async recipe => {
        const ingredientIds = (await db.query<'recipe_ingredients'>('recipe_ingredients', 
          item => item.recipe_id === recipe.id
        )).map(item => item.ingredient_id)

        // Add the ingredient count to the recipe object
        recipe.ingredient_count = ingredientIds.length
      })
    }


        
    
    // Start a new bake with this recipe
    const startBake = (recipe: any) => {
      router.push({
        path: '/bakes/new',
        query: { recipe_id: recipe.id }
      })
    }
    
    onMounted(() => {
      fetchRecipes()
    })
    
    return {
      loading,
      recipes,
      search,
      viewType,
      headers,
      startBake
    }
  }
})
</script>