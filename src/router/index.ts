import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'
import { auth } from '../services/auth'

// Layouts
import MainLayout from '../layouts/MainLayout.vue'

// Views
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' },
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('../views/InventoryView.vue'),
        meta: { title: 'Inventory' },
      },
      {
        path: 'inventory/:id',
        name: 'inventory-detail',
        component: () => import('../views/InventoryDetailView.vue'),
        meta: { title: 'Ingredient Details' },
      },
      {
        path: 'deliveries',
        name: 'deliveries',
        component: () => import('../views/DeliveriesView.vue'),
        meta: { title: 'Deliveries' },
      },
      {
        path: 'deliveries/new',
        name: 'new-delivery',
        component: () => import('../views/NewDeliveryView.vue'),
        meta: { title: 'New Delivery' },
      },
      {
        path: 'removals',
        name: 'removals',
        component: () => import('../views/RemovalsView.vue'),
        meta: { title: 'Removals' },
      },
      {
        path: 'removals/new',
        name: 'new-removal',
        component: () => import('../views/NewRemovalView.vue'),
        meta: { title: 'New Removal' },
      },
      {
        path: 'bakes',
        name: 'bakes',
        component: () => import('../views/BakesView.vue'),
        meta: { title: 'Bakes' },
      },
      {
        path: 'bakes/new',
        name: 'new-bake',
        component: () => import('../views/NewBakeView.vue'),
        meta: { title: 'New Bake' },
      },
      {
        path: 'recipes',
        name: 'recipes',
        component: () => import('../views/RecipesView.vue'),
        meta: { title: 'Recipes' },
      },
      {
        path: 'recipes/new',
        name: 'new-recipe',
        component: () => import('../views/NewRecipeView.vue'),
        meta: { title: 'New Recipe' },
      },
      {
        path: 'recipes/:id',
        name: 'recipe-detail',
        component: () => import('../views/RecipeDetailView.vue'),
        meta: { title: 'Recipe Details' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('../views/ReportsView.vue'),
        meta: { title: 'Reports' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/UsersView.vue'),
        meta: { title: 'User Management', requiresAdmin: true },
      },
      {
        path: 'auth-test',
        name: 'auth-test',
        component: () => import('../views/AuthTestView.vue'),
        meta: { title: 'Authentication Test', requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Login', guest: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
    meta: { title: 'Sign Up', guest: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { title: 'Reset Password', guest: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Track initialization status to prevent multiple initializations
let authInitialized = false
// Track failed navigation attempts to prevent infinite loops
let failedNavigationAttempts = 0

// Enhanced navigation guard
router.beforeEach(async (to, from, next) => {
  // Set document title
  document.title = `${to.meta.title || 'Bakers Dozen'} - Inventory Management`
  
  const authStore = useAuthStore()
  
  // Initialize auth store if not already done
  if (!authInitialized) {
    console.log('Initializing auth store from router guard')
    await authStore.initialize()
    authInitialized = true
  }
  
  // Wait a moment for auth state to stabilize
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Get a fresh session check
    const { data } = await supabase.auth.getSession()
    
    if (!data.session || !authStore.isLoggedIn) {
      console.log('No valid session found, redirecting to login')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  
    
    // Check if route is for guests only (login, signup, etc.)
    if (to.matched.some(record => record.meta.guest) && authStore.isLoggedIn) {
      console.log('Route is for guests only but user is logged in')
      next({ name: 'dashboard' })
      return
    }
  }
    
    next()
  // } catch (error) {
  //   console.error('Error in router guard:', error)
  //   failedNavigationAttempts++
  //   next({ name: 'login' })
  // }
})

// After each navigation, check if it was successful
router.afterEach((to, from) => {
  console.log(`Navigation completed: ${from.path} -> ${to.path}`)
  
  // If we successfully navigated to a new route, reset the failed navigation counter
  if (to.path !== from.path) {
    failedNavigationAttempts = 0
    console.log('Reset failed navigation counter')
  }
})

export default router
