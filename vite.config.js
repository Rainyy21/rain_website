import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tracking is disabled in dev, so no API proxy is needed.
export default defineConfig({ plugins: [react()] });
