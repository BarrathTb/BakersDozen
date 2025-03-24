<template>
  <v-card class="auth-test-container">
    <v-card-title class="text-h5">
      <v-icon left color="primary">mdi-test-tube</v-icon>
      Authentication Persistence Tests
    </v-card-title>
    
    <v-card-text>
      <p class="mb-4">
        This component tests the authentication persistence functionality to ensure
        that user sessions are correctly maintained across page refreshes and navigation.
      </p>
      
      <v-alert v-if="testComplete" :type="allTestsPassed ? 'success' : 'warning'" class="mb-4">
        <strong>Test Summary:</strong> {{ testSummary }}
      </v-alert>
      
      <v-btn
        color="primary"
        @click="runTests"
        :loading="isRunning"
        :disabled="isRunning"
        class="mb-4"
      >
        Run Tests
      </v-btn>
      
      <v-divider class="my-4"></v-divider>
      
      <h3 class="text-h6 mb-3">Test Results</h3>
      
      <v-list v-if="testResults.length > 0">
        <v-list-item
          v-for="(result, index) in testResults"
          :key="index"
          :class="result.success ? 'success--text' : 'error--text'"
        >
          <v-list-item-icon>
            <v-icon :color="result.success ? 'success' : 'error'">
              {{ result.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
          </v-list-item-icon>
          
          <v-list-item-content>
            <v-list-item-title>{{ result.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ result.message }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      
      <v-alert v-else type="info">
        No tests have been run yet. Click "Run Tests" to start testing.
      </v-alert>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="secondary"
        text
        @click="$emit('close')"
      >
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { runAuthPersistenceTests, getTestResults } from '../test-auth-persistence'

export default defineComponent({
  name: 'AuthPersistenceTest',
  
  emits: ['close'],
  
  setup() {
    const isRunning = ref(false)
    const testComplete = ref(false)
    const testResults = ref<Array<{name: string; success: boolean; message: string}>>([])
    const testSummary = ref('')
    
    const allTestsPassed = computed(() => {
      return testResults.value.every(result => result.success)
    })
    
    const runTests = async () => {
      isRunning.value = true
      testComplete.value = false
      testResults.value = []
      
      try {
        const results = await runAuthPersistenceTests()
        testResults.value = results.results
        testSummary.value = `${results.summary.passed}/${results.summary.total} tests passed (${Math.round(results.summary.passed/results.summary.total*100)}%)`
        testComplete.value = true
      } catch (error) {
        console.error('Error running auth persistence tests:', error)
        testResults.value = [{
          name: 'Test Runner Error',
          success: false,
          message: `Failed to run tests: ${(error as Error).message}`
        }]
        testSummary.value = 'Tests failed to run due to an error'
        testComplete.value = true
      } finally {
        isRunning.value = false
      }
    }
    
    return {
      isRunning,
      testComplete,
      testResults,
      testSummary,
      allTestsPassed,
      runTests
    }
  }
})
</script>

<style scoped>
.auth-test-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>