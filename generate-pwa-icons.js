// This is a simple script to generate placeholder PWA icons
// In a real project, you would use proper icons designed by a designer

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a simple SVG icon with the text "BD" (Bakers Dozen)
const createSVGIcon = (size, text = 'BD') => {
  const fontSize = Math.floor(size * 0.5)
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#FF6B6B"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${fontSize}px" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`
}

// Create a directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Main function to generate icons
const generateIcons = () => {
  const publicDir = path.join(__dirname, 'public')
  ensureDirectoryExists(publicDir)

  // Generate PWA icons
  const sizes = [192, 512]
  sizes.forEach((size) => {
    const svgContent = createSVGIcon(size)
    fs.writeFileSync(path.join(publicDir, `pwa-${size}x${size}.svg`), svgContent)
    console.log(`Generated pwa-${size}x${size}.svg`)
  })

  // Generate Apple touch icon
  const appleTouchIcon = createSVGIcon(180)
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon)
  console.log('Generated apple-touch-icon.png')

  // Generate masked icon
  const maskedIcon = createSVGIcon(512, '')
  fs.writeFileSync(path.join(publicDir, 'masked-icon.svg'), maskedIcon)
  console.log('Generated masked-icon.svg')

  console.log('All PWA icons generated successfully!')
}

// Run the function
generateIcons()
