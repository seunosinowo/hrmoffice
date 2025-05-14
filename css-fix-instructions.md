# CSS Fix Instructions for Vercel Deployment

The CSS issues in your Vercel deployment are likely due to differences in how CSS is processed between your local development environment and the production build. Here are steps to fix these issues:

## 1. Create a tailwind.config.js File

Your project is using Tailwind CSS v4 but doesn't have an explicit configuration file. Create one:

```bash
# Create the file in your project root
touch tailwind.config.js
```

Then add the following content to the file:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          25: '#f2f7ff',
          50: '#ecf3ff',
          100: '#dde9ff',
          200: '#c2d6ff',
          300: '#9cb9ff',
          400: '#7592ff',
          500: '#465fff',
          600: '#3641f5',
          700: '#2a31d8',
          800: '#252dae',
          900: '#262e89',
          950: '#161950',
        },
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f2f4f7',
          200: '#e4e7ec',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
          950: '#0c111d',
          dark: '#1a2231',
        },
      },
      boxShadow: {
        'theme-xs': '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        'theme-sm': '0px 1px 3px 0px rgba(16, 24, 40, 0.1), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
        'theme-md': '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'theme-lg': '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        'theme-xl': '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)',
        'focus-ring': '0px 0px 0px 4px rgba(70, 95, 255, 0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

## 2. Update postcss.config.js

Ensure your postcss.config.js is properly configured:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

## 3. Fix CSS Import Order

Make sure your CSS imports in main.tsx are in the correct order:

```typescript
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/flatpickr.css";
```

## 4. Add CSS Purge Configuration to vite.config.ts

Update your vite.config.ts to ensure CSS is properly processed in production:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group icons together
          if (id.includes('/icons/') || id.endsWith('Icon.js') || id.endsWith('Icon.jsx') || id.endsWith('Icon.tsx')) {
            return 'icons';
          }
          
          // Group by feature instead of by role
          if (id.includes('Competency_framework')) {
            return 'competency-framework';
          }
          if (id.includes('Job_profiling')) {
            return 'job-profiling';
          }
          if (id.includes('Assessment_management')) {
            return 'assessment-management';
          }
          if (id.includes('Analytics')) {
            return 'analytics';
          }
          
          // Group common dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('chart') || id.includes('apex')) {
              return 'vendor-charts';
            }
            if (id.includes('tailwind') || id.includes('css')) {
              return 'vendor-styles';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

## 5. Redeploy Your Application

After making these changes:

1. Commit the changes to your repository
2. Push the changes to your main branch
3. Redeploy your application on Vercel

## 6. Clear Browser Cache

After redeployment, make sure to clear your browser cache when testing the application to ensure you're seeing the latest CSS changes.
