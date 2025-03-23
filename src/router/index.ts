import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Set document title
  document.title = `${to.meta.title || 'Bakers Dozen'} - Inventory Management`

  console.log('Router guard: Checking authentication for route', to.path)

  // Initialize auth store if not already done
  const authStore = useAuthStore()
  
  try {
    // Always initialize the auth store to ensure we have the latest auth state
    await authStore.initialize()
    
    console.log('Auth state after initialization:', {
      user: authStore.user ? 'User exists' : 'No user',
      isLoggedIn: authStore.isLoggedIn
    })

    // Check if route requires authentication
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      console.log('Route requires authentication')
      
      // Check if user is logged in
      if (!authStore.isLoggedIn) {
        console.log('User is not logged in, redirecting to login page')
        // Redirect to login page
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }

      // Check if route requires admin role
      if (to.matched.some((record) => record.meta.requiresAdmin) && !authStore.isAdmin) {
        console.log('Route requires admin role but user is not an admin, redirecting to dashboard')
        // Redirect to dashboard if user is not an admin
        next({ name: 'dashboard' })
        return
      }
      
      console.log('User is authenticated and has required permissions')
    }

    // Check if route is for guests only (login, signup, etc.)
    if (to.matched.some((record) => record.meta.guest) && authStore.isLoggedIn) {
      console.log('Route is for guests only but user is logged in, redirecting to dashboard')
      // Redirect to dashboard if user is already logged in
      next({ name: 'dashboard' })
      return
    }

    // Proceed to route
    console.log('Proceeding to route', to.path)
    next()
  } catch (error) {
    console.error('Error in router guard:', error)
    
    // If there's an error, redirect to login page
    if (to.name !== 'login') {
      next({ name: 'login' })
    } else {
      next()
    }
  }
})

export default router
