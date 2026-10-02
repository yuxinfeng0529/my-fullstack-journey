import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages 项目站点部署在 https://<用户名>.github.io/<仓库名>/
  // 必须设置 base，否则打包出的资源路径指向根目录而全部 404（白屏）
  // 用 mode 判断而非 NODE_ENV：vite build 时 mode 稳定为 'production'
  base: mode === 'production' ? '/my-fullstack-journey/' : '/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
