import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/globe-sandbox/' : '/',
  plugins: [glsl()],
}));
