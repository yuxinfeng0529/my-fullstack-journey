import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 共享配置抽成普通对象，供 vitest.config.ts 直接 mergeConfig 使用。
// 若把 vite.config.ts 直接写成函数形式，mergeConfig 的类型检查会报 TS2345。
export const sharedConfig: UserConfig = {
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  ...sharedConfig,
  // GitHub Pages 项目站点部署在 https://<用户名>.github.io/<仓库名>/
  // 必须设置 base，否则打包出的资源路径指向根目录而全部 404（白屏）
  // 用 mode 判断而非 NODE_ENV：vite build 时 mode 稳定为 'production'
  base: mode === 'production' ? '/my-fullstack-journey/' : '/',
}))
