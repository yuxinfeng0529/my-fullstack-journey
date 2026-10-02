<script setup lang="ts">
/**
 * HomePage —— 首页
 * 内容藏在星空帘幕后面，帘幕拉开时淡入。
 * 帘幕拉到最开后保留 V 字轮廓，常驻在页面上作为装饰。
 */
import { ref } from 'vue'
import OpeningScene from '../components/OpeningScene.vue'

/** 内容是否已经淡入 */
const contentVisible = ref(false)

/** 帘幕拉开到一定程度，首页开始浮现 */
function handleReveal() {
  contentVisible.value = true
}

function handleOpeningFinished() {
  // 兜底：确保内容最终一定是可见的
  contentVisible.value = true
}
</script>

<template>
  <div class="home-page">
    <main class="home-content" :class="{ 'is-visible': contentVisible }">
      <h1 class="main-title">DeepSeek</h1>
      <p class="subtitle">我的全栈之旅</p>
    </main>

    <!-- 帘幕常驻在内容之上，拉开后保留下方的 V 字轮廓 -->
    <OpeningScene @reveal="handleReveal" @finished="handleOpeningFinished" />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 与星空底色一致的深蓝黑，帘幕裂口处不会露出突兀的纯黑 */
  background: #03060f;
}

.home-content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  text-align: center;
  opacity: 0;
  transform: translateY(14px) scale(0.985);
  transition:
    opacity 1.6s ease-out,
    transform 1.6s ease-out;
}

.home-content.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.main-title {
  font-size: clamp(3rem, 12vw, 9rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.08;
  /* 主标题：DeepSeek 蓝，从上到下渐变 */
  background: linear-gradient(
    180deg,
    #eaf4ff 0%,
    var(--ds-blue-100) 12%,
    var(--ds-blue-300) 38%,
    var(--ds-blue-500) 68%,
    var(--ds-blue-700) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 6px 34px rgba(28, 111, 255, 0.42));
}

.subtitle {
  margin-top: 0.9rem;
  font-size: clamp(0.95rem, 2.2vw, 1.4rem);
  letter-spacing: 0.42em;
  /* 缩进补偿，让字距看起来居中 */
  text-indent: 0.42em;
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .home-content {
    transition-duration: 0.3s;
  }
}
</style>
