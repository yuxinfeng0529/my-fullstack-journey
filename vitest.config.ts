import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
// 用 sharedConfig（普通对象）而不是默认导出的函数形式，
// 否则 mergeConfig 会因类型不匹配报 TS2345。
import { sharedConfig } from './vite.config.ts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
