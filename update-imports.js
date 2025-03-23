/**
 * Migration script to update imports from Supabase to the new database service
 *
 * This script will:
 * 1. Remove Supabase imports
 * 2. Add imports for the new database and auth services
 * 3. Update any Supabase API calls to use the new services
 *
 * Usage:
 * node update-imports.js
 */

const fs = require('fs')
const path = require('path')

// Configuration
const rootDir = './src'
const fileExtensions = ['.ts', '.js', '.vue']
const excludeDirs = ['node_modules', 'dist', '.git']

// Patterns to replace
const replacements = [
  // Import replacements
  {
    pattern: /import\s+{\s*supabase\s*}\s+from\s+['"](.*)\/plugins\/supabase['"]/g,
    replacement: `import { db } from '$1/services/database'`,
  },
  {
    pattern: /import\s+.*\s+from\s+['"](.*)\/plugins\/supabase['"]/g,
    replacement: `import { db } from '$1/services/database'`,
  },
  {
    pattern: /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/.*['"]/g,
    replacement: ``,
  },

  // API call replacements
  // Select queries
  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*from\s*\(\s*['"](\w+)['"]\s*\)\s*\.\s*select\s*\((.*?)\)\s*(?:\.eq\s*\(\s*['"](\w+)['"]\s*,\s*(\w+)\s*\))?/g,
    replacement: (match, dataVar, errorVar, table, select, eqField, eqValue) => {
      if (eqField && eqValue) {
        return `const ${dataVar || 'data'} = db.query('${table}', item => item.${eqField} === ${eqValue})`
      } else {
        return `const ${dataVar || 'data'} = db.getAll('${table}')`
      }
    },
  },

  // Insert queries
  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*from\s*\(\s*['"](\w+)['"]\s*\)\s*\.\s*insert\s*\((.*?)\)/g,
    replacement: (match, dataVar, errorVar, table, record) => {
      return `const ${dataVar || 'data'} = db.insert('${table}', ${record})`
    },
  },

  // Update queries
  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*from\s*\(\s*['"](\w+)['"]\s*\)\s*\.\s*update\s*\((.*?)\)\s*\.\s*eq\s*\(\s*['"](\w+)['"]\s*,\s*(\w+)\s*\)/g,
    replacement: (match, dataVar, errorVar, table, updates, idField, idValue) => {
      return `const ${dataVar || 'data'} = db.update('${table}', { ...${updates}, id: ${idValue} })`
    },
  },

  // Delete queries
  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*from\s*\(\s*['"](\w+)['"]\s*\)\s*\.\s*delete\s*\(\s*\)\s*\.\s*eq\s*\(\s*['"](\w+)['"]\s*,\s*(\w+)\s*\)/g,
    replacement: (match, dataVar, errorVar, table, idField, idValue) => {
      return `const result = db.delete('${table}', ${idValue})`
    },
  },

  // Auth replacements
  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*auth\s*\.\s*signInWithPassword\s*\((.*?)\)/g,
    replacement: (match, dataVar, errorVar, params) => {
      return `const result = await auth.signInWithPassword(${params})`
    },
  },

  {
    pattern:
      /const\s+{\s*data(\w*),\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*auth\s*\.\s*signUp\s*\((.*?)\)/g,
    replacement: (match, dataVar, errorVar, params) => {
      return `const result = await auth.signUp(${params})`
    },
  },

  {
    pattern:
      /const\s+{\s*error(\w*)\s*}\s*=\s*await\s+supabase\s*\.\s*auth\s*\.\s*signOut\s*\(\s*\)/g,
    replacement: (match, errorVar) => {
      return `await auth.signOut()`
    },
  },

  // Realtime subscriptions
  {
    pattern: /const\s+(\w+)\s*=\s*supabase\s*\.\s*channel\s*\(\s*['"].*['"]\s*\)/g,
    replacement: (match, varName) => {
      return `const unsubscribe = db.subscribe`
    },
  },

  // Remove error checks that are no longer needed
  {
    pattern: /if\s*\(\s*(\w+)Error\s*\)\s*throw\s+\1Error/g,
    replacement: ``,
  },
]

// Function to recursively process files in a directory
function processDirectory(directory) {
  const items = fs.readdirSync(directory)

  for (const item of items) {
    const itemPath = path.join(directory, item)
    const stats = fs.statSync(itemPath)

    if (stats.isDirectory() && !excludeDirs.includes(item)) {
      processDirectory(itemPath)
    } else if (stats.isFile() && fileExtensions.includes(path.extname(item))) {
      processFile(itemPath)
    }
  }
}

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`)

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Apply replacements
  for (const { pattern, replacement } of replacements) {
    const newContent = content.replace(pattern, replacement)
    if (newContent !== content) {
      content = newContent
      modified = true
    }
  }

  // Save changes if the file was modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Updated ${filePath}`)
  }
}

// Main execution
console.log('Starting migration...')
processDirectory(rootDir)
console.log('Migration complete!')
