<template>
  <div>
    <h1 class="text-h4 mb-4">User Management</h1>
    
    <v-alert
      v-if="!authStore.isAdmin"
      type="warning"
      text:true
      class="mb-4"
    >
      You need administrator privileges to access this page.
    </v-alert>
    
    <v-card v-if="authStore.isAdmin">
      <v-card-title>
        <v-icon left>mdi-account-group</v-icon>
        System Users
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          hide-details
          dense
        ></v-text-field>
      </v-card-title>
      
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :search="search"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.role="{ item }">
            <v-chip
              :color="item.raw.role === 'admin' ? 'primary' : 'secondary'"
              text-color="white"
              small
            >
              {{ item.raw.role }}
            </v-chip>
          </template>
          
          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.raw.created_at) }}
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-menu bottom left>
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              
              <v-list>
                <v-list-item @click="changeRole(item.raw)">
                  <v-list-item-title>
                    {{ item.raw.role === 'admin' ? 'Remove Admin' : 'Make Admin' }}
                  </v-list-item-title>
                </v-list-item>
                
                <v-list-item @click="resetPassword(item.raw)">
                  <v-list-item-title>
                    Reset Password
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Dialogs for changing role and resetting password -->
    <v-dialog v-model="roleDialog" max-width="500px">
      <!-- Role change dialog content -->
    </v-dialog>
    
    <v-dialog v-model="resetDialog" max-width="500px">
      <!-- Password reset dialog content -->
    </v-dialog>
    
    <!-- Snackbars for success and error messages -->
    <v-snackbar v-model="showSuccessAlert" color="success" timeout="5000">
      {{ successMessage }}
      <template v-slot:actions>
        <v-btn text @click="showSuccessAlert = false">Close</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="showErrorAlert" color="error" timeout="5000">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn text @click="showErrorAlert = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'
import { format } from 'date-fns'

const authStore = useAuthStore()

const loading = ref(true)
const users = ref<any[]>([])
const search = ref('')

const roleDialog = ref(false)
const resetDialog = ref(false)
const selectedUser = ref<any>(null)

const showSuccessAlert = ref(false)
const showErrorAlert = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const headers = [
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Created', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const fetchUsers = async () => {
  if (!authStore.isAdmin) return
  
  loading.value = true
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    users.value = data || []
  } catch (error: any) {
    console.error('Error fetching users:', error)
    showError('Failed to load users')
  } finally {
    loading.value = false
  }
}

const changeRole = (user: any) => {
  selectedUser.value = user
  roleDialog.value = true
}

const resetPassword = (user: any) => {
  selectedUser.value = user
  resetDialog.value = true
}

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessAlert.value = true
}

const showError = (message: string) => {
  errorMessage.value = message
  showErrorAlert.value = true
}

onMounted(() => {
  if (authStore.isAdmin) {
    fetchUsers()
  }
})
</script>
