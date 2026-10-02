<script setup lang="ts">
/**
 * OpeningScene —— 开场动画总调度
 * 顺序：星空帘幕合拢 → 从底部中间向两侧翻起（留下 V 字轮廓）→
 *       首页内容在帘幕后方淡入。
 *
 * 动画结束后帘幕不会移除：拉到最开时保留的 V 字轮廓继续留在页面上。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import StarField from './StarField.vue'

const emit = defineEmits<{
  /** 首页内容可以开始淡入了 */
  (e: 'reveal'): void
  /** 开场动画播放完毕（帘幕仍保留在画面上） */
  (e: 'finished'): void
}>()

/** 0 = 合拢，1 = 完全拉开（仍保留 V 字） */
const open = ref(0)

const timers: number[] = []
function later(fn: () => void, delay: number) {
  timers.push(window.setTimeout(fn, delay))
}

/** 星空铺开后开始拉开的时刻 */
const OPEN_START = 1000
/** 拉开动画时长 */
const OPEN_DURATION = 3000
/** 拉开进行到这个比例时，首页开始淡入 */
const REVEAL_AT = 0.45

function runOpen() {
  const start = performance.now()
  let revealed = false

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / OPEN_DURATION)
    // 五次缓动：起手与收尾都很柔，整个过程丝滑
    open.value = t * t * t * (t * (t * 6 - 15) + 10)

    // 裂口开到一定程度就让首页淡入，与拉开过程重叠，衔接更自然
    if (!revealed && t >= REVEAL_AT) {
      revealed = true
      emit('reveal')
    }

    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      // 帘幕保留在画面上（V 字轮廓），只通知外部动画结束
      emit('finished')
    }
  }
  requestAnimationFrame(step)
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    open.value = 1
    emit('reveal')
    emit('finished')
    return
  }
  later(runOpen, OPEN_START)
})

onBeforeUnmount(() => {
  timers.forEach((id) => clearTimeout(id))
})
</script>

<template>
  <div class="opening-scene" aria-hidden="true">
    <StarField :open="open" />
  </div>
</template>

<style scoped>
.opening-scene {
  position: fixed;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  /* 透明底：帘幕之外能直接透出后面的首页 */
  background: transparent;
  pointer-events: none;
}
</style>
