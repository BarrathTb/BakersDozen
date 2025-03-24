<template>
  <v-app :theme="themeStore.currentTheme">
    <!-- App Bar -->
    <v-app-bar color="primary">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-toolbar-title>Bakers Dozen</v-toolbar-title>
      <v-spacer></v-spacer>
      <template v-slot:append>
        <v-btn icon @click="toggleTheme">
          <v-icon>{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
        <v-menu v-if="user" v-model="userMenu" :close-on-content-click="false" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-card min-width="200">
            <v-list>
              <v-list-item>
                <v-list-item-title>{{ user.email }}</v-list-item-title>
                <v-list-item-subtitle>{{ userRole }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn block color="primary" variant="elevated" @click="logout">Logout</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </template>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" :permanent="$vuetify.display.mdAndUp" :temporary="$vuetify.display.smAndDown" width="256">
      <v-list>
        <v-list-item to="/" :active="$route.path === '/'" color="primary" prepend-icon="mdi-view-dashboard">
          Dashboard
        </v-list-item>

        <v-list-item to="/inventory" :active="$route.path.startsWith('/inventory')" color="primary" prepend-icon="mdi-package-variant-closed">
          Inventory
        </v-list-item>

        <v-list-item to="/deliveries" :active="$route.path.startsWith('/deliveries')" color="primary" prepend-icon="mdi-truck-delivery">
          Deliveries
        </v-list-item>

        <v-list-item to="/removals" :active="$route.path.startsWith('/removals')" color="primary" prepend-icon="mdi-minus-circle">
          Removals
        </v-list-item>

        <v-list-item to="/bakes" :active="$route.path.startsWith('/bakes')" color="primary" prepend-icon="mdi-bread-slice">
          Bakes
        </v-list-item>

        <v-list-item to="/recipes" :active="$route.path.startsWith('/recipes')" color="primary" prepend-icon="mdi-book-open-variant">
          Recipes
        </v-list-item>

        <v-list-item to="/reports" :active="$route.path.startsWith('/reports')" color="primary" prepend-icon="mdi-chart-bar">
          Reports
        </v-list-item>

        <v-list-item v-if="isAdmin" to="/users" :active="$route.path.startsWith('/users')" color="primary" prepend-icon="mdi-account-group">
          User Management
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="fill-height">
      <v-container fluid class="fill-height d-flex align-center justify-center">
        <router-view></router-view>
      </v-container>
    </v-main>


    <!-- Footer -->
    <!-- <v-footer color="primary" :app="true">
  <span>&copy; {{ new Date().getFullYear() }} Bakers Dozen</span>
</v-footer> -->


  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

export default defineComponent({
  name: 'MainLayout',
  
  setup() {
    const drawer = ref(false)
    const userMenu = ref(false)
    const router = useRouter()
    const authStore = useAuthStore()
    const themeStore = useThemeStore()

    const user = computed(() => authStore.user)
    const isAdmin = computed(() => authStore.isAdmin)
    const userRole = computed(() => isAdmin.value ? 'Admin' : 'User')
    const isDarkMode = computed(() => themeStore.isDarkMode)

    // Close drawer on mobile when route changes
    router.afterEach(() => {
      if (window.innerWidth < 960) {
        drawer.value = false
      }
    })

    // Set drawer state based on screen size
    onMounted(() => {
      drawer.value = window.innerWidth >= 960
      
      // Add resize listener
      window.addEventListener('resize', () => {
        drawer.value = window.innerWidth >= 960
      })
    })

    const logout = async () => {
      await authStore.signOut()
      router.push('/login')
    }

    const toggleTheme = () => {
      themeStore.toggleTheme()
    }

    return {
      drawer,
      userMenu,
      user,
      isAdmin,
      userRole,
      themeStore,
      isDarkMode,
      logout,
      toggleTheme
    }
  }
})
</script>

<style scoped>
/* Add responsive styles */
.v-main {
  width: 100%;
  max-width: 100%;
}

.v-container {
  max-width: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 960px) {
  .v-navigation-drawer {
    position: fixed !important;
    z-index: 3;
  }
  
  /* .v-main {
    margin-left: 256px;
    width: calc(100% - 256px);
  } */
}
</style>
