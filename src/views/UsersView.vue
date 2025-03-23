<template>
  <div>
    <h1 class="text-h4 mb-4">User Management</h1>
    
    <v-alert
      v-if="!isAdmin"
      type="warning"
      text
      class="mb-4"
    >
      You need administrator privileges to access this page.
    </v-alert>
    
    <v-card v-if="isAdmin">
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
              :color="item.role === 'admin' ? 'primary' : 'secondary'"
              text-color="white"
              small
            >
              {{ item.role }}
            </v-chip>
          </template>
          
          <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-menu
              bottom
              left
            >
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              
              <v-list>
                <v-list-item
                  @click="changeRole(item)"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-account-convert</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                    {{ item.role === 'admin' ? 'Remove Admin' : 'Make Admin' }}
                  </v-list-item-title>
                </v-list-item>
                
                <v-list-item
                  @click="resetPassword(item)"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-lock-reset</v-icon>
                  </v-list-item-icon>
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
    
    <!-- Change Role Dialog -->
    <v-dialog
      v-model="roleDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          <v-icon left>mdi-account-convert</v-icon>
          Change User Role
        </v-card-title>
        
        <v-card-text v-if="selectedUser">
          <p>
            Are you sure you want to change the role of <strong>{{ selectedUser.email }}</strong> from 
            <v-chip
              :color="selectedUser.role === 'admin' ? 'primary' : 'secondary'"
              text-color="white"
              x-small
              class="mx-1"
            >
              {{ selectedUser.role }}
            </v-chip>
            to
            <v-chip
              :color="selectedUser.role === 'admin' ? 'secondary' : 'primary'"
              text-color="white"
              x-small
              class="mx-1"
            >
              {{ selectedUser.role === 'admin' ? 'user' : 'admin' }}
            </v-chip>?
          </p>
          
          <v-alert
            v-if="selectedUser.role === 'admin'"
            type="warning"
            text
            class="mt-4"
          >
            This will remove administrator privileges from this user.
          </v-alert>
          
          <v-alert
            v-else
            type="warning"
            text
            class="mt-4"
          >
            This will grant administrator privileges to this user, giving them full access to all system functions.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="roleDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="updating"
            @click="confirmRoleChange"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Reset Password Dialog -->
    <v-dialog
      v-model="resetDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          <v-icon left>mdi-lock-reset</v-icon>
          Reset User Password
        </v-card-title>
        
        <v-card-text v-if="selectedUser">
          <p>
            Are you sure you want to send a password reset email to <strong>{{ selectedUser.email }}</strong>?
          </p>
          
          <v-alert
            type="info"
            text
            class="mt-4"
          >
            This will send an email to the user with instructions to reset their password.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="resetDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="updating"
            @click="confirmPasswordReset"
          >
            Send Reset Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Success/Error Alerts -->
    <v-snackbar
      v-model="showSuccessAlert"
      color="success"
      timeout="5000"
    >
      {{ successMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="showSuccessAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="showErrorAlert"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="showErrorAlert = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { supabase } from '../plugins/supabase'
import { useAuthStore } from '../stores/auth'

export default defineComponent({
  name: 'UsersView',
  
  setup() {
    const authStore = useAuthStore()
    
    const loading = ref(true)
    const updating = ref(false)
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
      { text: 'Email', value: 'email' },
      { text: 'Role', value: 'role' },
      { text: 'Created', value: 'created_at' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]
    
    // Check if current user is admin
    const isAdmin = computed(() => authStore.isAdmin)
    
    // Format date for display
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), 'MMM d, yyyy')
    }
    
    // Show success message
    const showSuccess = (message: string) => {
      successMessage.value = message
      showSuccessAlert.value = true
    }
    
    // Show error message
    const showError = (message: string) => {
      errorMessage.value = message
      showErrorAlert.value = true
    }
    
    // Fetch users
    const fetchUsers = async () => {
      if (!isAdmin.value) return
      
      loading.value = true
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        users.value = data || []
      } catch (error) {
        console.error('Error fetching users:', error)
        showError('Failed to load users')
      } finally {
        loading.value = false
      }
    }
    
    // Change user role
    const changeRole = (user: any) => {
      selectedUser.value = user
      roleDialog.value = true
    }
    
    // Confirm role change
    const confirmRoleChange = async () => {
      if (!selectedUser.value) return
      
      updating.value = true
      
      try {
        const newRole = selectedUser.value.role === 'admin' ? 'user' : 'admin'
        
        const { error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', selectedUser.value.id)
        
        if (error) throw error
        
        // Update local data
        const index = users.value.findIndex(u => u.id === selectedUser.value.id)
        if (index !== -1) {
          users.value[index].role = newRole
        }
        
        showSuccess(`User role updated to ${newRole}`)
        roleDialog.value = false
      } catch (error: any) {
        console.error('Error updating user role:', error)
        showError(error.message || 'Failed to update user role')
      } finally {
        updating.value = false
      }
    }
    
    // Reset user password
    const resetPassword = (user: any) => {
      selectedUser.value = user
      resetDialog.value = true
    }
    
    // Confirm password reset
    const confirmPasswordReset = async () => {
      if (!selectedUser.value) return
      
      updating.value = true
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          selectedUser.value.email
        )
        
        if (error) throw error
        
        showSuccess('Password reset email sent')
        resetDialog.value = false
      } catch (error: any) {
        console.error('Error sending password reset:', error)
        showError(error.message || 'Failed to send password reset email')
      } finally {
        updating.value = false
      }
    }
    
    onMounted(() => {
      if (isAdmin.value) {
        fetchUsers()
      }
    })
    
    return {
      loading,
      updating,
      users,
      search,
      headers,
      isAdmin,
      roleDialog,
      resetDialog,
      selectedUser,
      showSuccessAlert,
      showErrorAlert,
      successMessage,
      errorMessage,
      formatDate,
      changeRole,
      confirmRoleChange,
      resetPassword,
      confirmPasswordReset
    }
  }
})
</script>