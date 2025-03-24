import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../services/supabase'

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

// Navigation guards
// router.beforeEach(async (to, from, next) => {
//   // Set document title
//   document.title = `${to.meta.title || 'Bakers Dozen'} - Inventory Management`

//   console.log(`Router guard: Checking authentication for route ${to.path} (from: ${from.path})`)

//   // Initialize auth store if not already done
//   const authStore = useAuthStore()
//   // authStore.getSession() // Removed as it does not exist on authStore
//   // Reset failed navigation counter on successful navigation
//   if (from.name) {
//     failedNavigationAttempts = 0
//   }

//   // Prevent infinite navigation loops
//   if (failedNavigationAttempts > 3) {
//     console.error('Too many failed navigation attempts, forcing navigation to login')
//     next({ name: 'login', replace: true })
//     return
//   }
  
//   try {
//     // Initialize the auth store if not already initialized
//     if (!authInitialized) {
//       await authStore.initialize()
//       authInitialized = true
//     }
    
//     console.log(`Auth state for route ${to.path}:`, {
//       user: authStore.user ? 'User exists' : 'No user',
//       isLoggedIn: authStore.isLoggedIn,
//       loading: authStore.loading
//     })
    

//     // Check if route requires authentication
//     if (to.matched.some((record) => record.meta.requiresAuth)) {
//       console.log('Route requires authentication')
      
//       // Check if user is logged in
//       if (!authStore.isLoggedIn) {
//         console.log('User is not logged in, redirecting to login page')
//         // Redirect to login page
//         next({ name: 'login', query: { redirect: to.fullPath } })
//         return
//       }

//       // Check if route requires admin role
//       if (to.matched.some((record) => record.meta.requiresAdmin) && !authStore.isAdmin) {
//         console.log('Route requires admin role but user is not an admin, redirecting to dashboard')
//         // Redirect to dashboard if user is not an admin
//         next({ name: 'dashboard' })
//         return
//       }
      
//       console.log('User is authenticated and has required permissions')
//     }

//     // Check if route is for guests only (login, signup, etc.)
//     if (to.matched.some((record) => record.meta.guest) && authStore.isLoggedIn) {
//       console.log('Route is for guests only but user is logged in, redirecting to dashboard')
//       // Redirect to dashboard if user is already logged in
//       next({ name: 'dashboard' })
//       return
//     }

//     // Proceed to route
//     console.log('Proceeding to route', to.path)
//     next()
//   } catch (error) {
//     console.error(`Error in router guard for route ${to.path}:`, error)
//     failedNavigationAttempts++
    
//     // Attempt recovery
//     try {
//       console.log('Attempting to recover from router guard error...')
      
//       // Try to recover from failed initialization
//       await authStore.recoverFromFailedInit()

//       // Check Supabase session directly as a last resort
//       const { data: { session } } = await supabase.auth.getSession()
//       console.log('Direct Supabase session check:', session ? 'Session exists' : 'No session')
      
//       // Reset initialization flag to force re-initialization on next navigation
//       authInitialized = false
//       authStore.loading = false
      
//       // If we're not going to login already, and recovery didn't work, redirect to login
//       if (to.name !== 'login' && !authStore.isLoggedIn) {
//         console.log('Recovery unsuccessful, redirecting to login')
//         next({ name: 'login' })
//         return
//       }
      
//       // If recovery worked, proceed to the route
//       console.log('Recovery successful, proceeding to route')
//       next()
//     } catch (recoveryError) {
//       console.error('Recovery failed:', recoveryError)
//       failedNavigationAttempts++
    
//       // If recovery failed and we're not already going to login, redirect to login
//       if (to.name !== 'login') {
//         next({ name: 'login' })
//       } else {
//         next()
//       }
//     }
//   }
// })
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth store if not already done
  if (!authInitialized) {
    await authStore.initialize()
    authInitialized = true
  }
  
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
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
