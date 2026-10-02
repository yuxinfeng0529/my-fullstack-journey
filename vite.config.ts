import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 的项目站点部署在 https://<用户名>.github.io/<仓库名>/
  // 必须设置 base，否则打包出的资源路径会指向根目录而全部 404
  base: process.env.NODE_ENV === 'production' ? '/my-fullstack-journey/' : '/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
