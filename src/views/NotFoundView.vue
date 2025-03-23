<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" class="text-center">
        <v-card class="elevation-12">
          <v-card-title class="text-h4 justify-center">
            <v-icon size="48" color="error" class="mr-2">mdi-alert-circle</v-icon>
            404
          </v-card-title>
          <v-card-text class="text-h6">
            Page Not Found
          </v-card-text>
          <v-card-text>
            The page you are looking for doesn't exist or has been moved.
          </v-card-text>
          <v-card-actions class="justify-center pb-6">
            <v-btn
              color="primary"
              to="/"
            >
              <v-icon left>mdi-home</v-icon>
              Return to Dashboard
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NotFoundView'
})
</script>