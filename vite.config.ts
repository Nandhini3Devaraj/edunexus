/**
 * ==========================================================
 * EDUNEXUS - Vite Configuration
 * ==========================================================
 * 
 * This file configures the Vite bundler for the EDUNEXUS frontend.
 * It sets up the development server, proxy settings, and build options.
 * 
 * Key Features:
 * - React SWC plugin for fast compilation
 * - API proxy to FastAPI backend (avoids CORS issues)
 * - Path aliases for cleaner imports (@/components, @/lib, etc.)
 * 
 * Environment:
 * - Development server runs on port 8080
 * - Backend API runs on port 8000
 * 
 * ==========================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";  // SWC-based React plugin (faster than Babel)
import path from "path";
import { componentTagger } from "lovable-tagger";  // Development tool for component tagging

// Vite configuration - https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  /**
   * Development Server Configuration
   * --------------------------------
   * - host: "::" allows connections from any IP (useful for testing on devices)
   * - port: 8080 is the frontend dev server port
   * - hmr: Hot Module Replacement settings
   */
  server: {
    host: "::",             // Listen on all network interfaces
    port: 8080,             // Frontend dev server port
    hmr: {
      overlay: false,       // Disable error overlay (use browser console instead)
    },
    
    /**
     * Proxy Configuration
     * -------------------
     * Routes API calls from frontend (localhost:8080) to backend (localhost:8000)
     * This avoids CORS issues during development.
     * 
     * How it works:
     * - Request: http://localhost:8080/api/auth/login
     * - Proxied to: http://localhost:8000/api/auth/login
     * 
     * changeOrigin: Modifies the origin header to match the target
     * secure: false allows requests to http (not https) targets
     */
    proxy: {
      // Proxy all /api/* requests to FastAPI backend
      '/api': {
        target: 'http://localhost:8000',  // FastAPI backend URL
        changeOrigin: true,               // Required for virtual hosted sites
        secure: false,                    // Allow http (not https)
      },
      // Proxy /uploads/* for accessing uploaded files (PDFs, QR codes, etc.)
      '/uploads': {
        target: 'http://localhost:8000',  // Static files served by FastAPI
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  /**
   * Vite Plugins
   * ------------
   * - react(): SWC-based React plugin for fast JSX/TSX compilation
   * - componentTagger(): Dev-only plugin for debugging components
   */
  plugins: [
    react(),                                          // Required for React support
    mode === "development" && componentTagger()       // Only in dev mode
  ].filter(Boolean),                                  // Remove falsy values
  
  /**
   * Path Resolution
   * ---------------
   * Configures the '@' alias to point to the src directory.
   * This enables clean imports like: import { Button } from '@/components/ui/button'
   */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // @ = ./src
    },
  },
}));
