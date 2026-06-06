import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const chunkGroups = [
  { name: 'vendor-react', packages: ['/react/', '/react-dom/', '/react-router', '/scheduler/'] },
  { name: 'vendor-supabase', packages: ['/@supabase/'] },
  { name: 'vendor-query', packages: ['/@tanstack/'] },
  { name: 'vendor-ui', packages: ['/@radix-ui/', '/cmdk/'] },
  { name: 'vendor-charts', packages: ['/recharts/', '/d3-', '/victory-vendor/'] },
  {
    name: 'vendor-pdf-fonts',
    packages: ['/fontkit/', '/unicode-', '/restructure/', '/brotli/', '/dfa/', '/hyphen/', '/linebreak/'],
  },
  { name: 'vendor-pdf-assets', packages: ['/yoga-layout/', '/png-js/', '/jay-peg/', '/pako/'] },
  { name: 'vendor-forms', packages: ['/react-hook-form/', '/@hookform/', '/zod/'] },
]

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          const normalizedId = id.split(path.sep).join('/')
          const reactPdfPackage = normalizedId.match(/node_modules\/@react-pdf\/([^/]+)/)
          if (reactPdfPackage) return `vendor-pdf-${reactPdfPackage[1]}`

          const group = chunkGroups.find(({ packages }) =>
            packages.some(packageName => normalizedId.includes(packageName))
          )

          return group?.name ?? 'vendor-misc'
        },
      },
    },
  },
})
