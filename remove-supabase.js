// Script to remove Supabase-related files
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Files to remove
const filesToRemove = ['src/plugins/supabase.ts', 'src/types/supabase.ts']

// Directories to remove
const dirsToRemove = ['supabase']

// Remove files
filesToRemove.forEach((file) => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`Removed file: ${file}`)
    } else {
      console.log(`File not found: ${file}`)
    }
  } catch (err) {
    console.error(`Error removing file ${file}:`, err)
  }
})

// Remove directories recursively
dirsToRemove.forEach((dir) => {
  try {
    if (fs.existsSync(dir)) {
      // Use rmSync with recursive option in Node.js 14+
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`Removed directory: ${dir}`)
    } else {
      console.log(`Directory not found: ${dir}`)
    }
  } catch (err) {
    console.error(`Error removing directory ${dir}:`, err)
  }
})

console.log('Supabase removal completed.')
