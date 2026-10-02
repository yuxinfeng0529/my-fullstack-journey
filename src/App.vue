<script setup lang="ts">
/**
 * App.vue —— 纯外壳
 * 只负责挂载页面组件，不放任何具体业务内容。
 * 以后新增页面时，只改下面这一处引入即可。
 */
import HomePage from './pages/HomePage.vue'
</script>

<template>
  <div class="app-shell">
    <HomePage />
  </div>
</template>

<style scoped>
.app-shell {
  width: 100%;
  min-height: 100vh;
}
</style>
