// Debug tool for diagnosing data access issues
import { supabase } from './services/supabase'

// Function to test data access for all tables
export async function testDataAccess() {
  console.log('=== TESTING DATA ACCESS ===')
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
  
  // Check authentication status
  const { data: authData } = await supabase.auth.getSession()
  console.log('Authentication status:', authData.session ? 'Authenticated' : 'Not authenticated')
  if (authData.session) {
    console.log('User ID:', authData.session.user.id)
    console.log('User email:', authData.session.user.email)
  }
  
  // Test tables
  const tables = [
    'users',
    'ingredients',
    'recipes',
    'recipe_ingredients',
    'bakes',
    'deliveries',
    'delivery_items',
    'removals',
    'removal_items'
  ]
  
  // Test each table
  for (const table of tables) {
    try {
      console.log(`\nTesting table: ${table}`)
      
      // Count records
      const { data: countData, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error(`Error counting records in ${table}:`, countError)
        continue
      }
      
      const count = countData?.length || 0
      console.log(`Record count: ${count}`)
      
      // Get sample data
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3)
      
      if (error) {
        console.error(`Error fetching data from ${table}:`, error)
        continue
      }
      
      console.log(`Sample data (${data.length} records):`, data)
      
      // Check RLS policies
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_policies_for_table', { table_name: table })
      
      if (policiesError) {
        console.warn(`Could not fetch RLS policies for ${table}:`, policiesError)
      } else {
        console.log(`RLS policies for ${table}:`, policiesData)
      }
    } catch (err) {
      console.error(`Error testing table ${table}:`, err)
    }
  }
  
  console.log('\n=== DATA ACCESS TEST COMPLETE ===')
}

// Function to fix RLS policies for all tables
export async function fixRlsPolicies() {
  console.log('=== FIXING RLS POLICIES ===')
  
  // Check authentication status
  const { data: authData } = await supabase.auth.getSession()
  if (!authData.session) {
    console.error('You must be authenticated to fix RLS policies')
    return
  }
  
  // Tables to fix
  const tables = [
    'users',
    'ingredients',
    'recipes',
    'recipe_ingredients',
    'bakes',
    'deliveries',
    'delivery_items',
    'removals',
    'removal_items'
  ]
  
  // Fix each table
  for (const table of tables) {
    try {
      console.log(`\nFixing RLS policies for table: ${table}`)
      
      // Enable RLS
      const { error: enableError } = await supabase.rpc('enable_rls', { table_name: table })
      if (enableError) {
        console.error(`Error enabling RLS for ${table}:`, enableError)
      }
      
      // Create SELECT policy
      const { error: selectError } = await supabase.rpc('create_select_policy', { 
        table_name: table,
        policy_name: `Allow select for ${table}`
      })
      
      if (selectError) {
        console.error(`Error creating SELECT policy for ${table}:`, selectError)
      }
      
      console.log(`RLS policies fixed for ${table}`)
    } catch (err) {
      console.error(`Error fixing RLS policies for ${table}:`, err)
    }
  }
  
  console.log('\n=== RLS POLICY FIX COMPLETE ===')
}

// Run the tests if this file is executed directly
if (import.meta.url.endsWith('debug-data-access.ts')) {
  testDataAccess()
    .then(() => {
      console.log('Data access test completed')
    })
    .catch(err => {
      console.error('Data access test error:', err)
    })
}