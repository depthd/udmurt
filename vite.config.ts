/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { contentPlugin } from './vite/content-plugin.ts';

// Сайт живёт по адресу https://depthd.github.io/udmurt/ — отсюда base.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/udmurt/',
  plugins: [contentPlugin(), svelte()],
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  build: { target: 'es2022', sourcemap: true },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
