<script setup lang="ts">
/**
 * StarField —— 星空帘幕
 * 一片有褶皱的夜空，从底向上像帘幕一样被拉起收起，露出后面的首页。
 *
 * 关键点：
 * 1. 下摆不是一条水平直线，而是中间略高、两侧下垂的弧形，
 *    更接近真实布被向上提起时的形状。
 * 2. 帘幕之外完全透明，后面的首页内容可以直接透出来。
 * 3. 合拢时是干净的星空，褶皱只在拉起过程中才浮现。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 星星密度（会按屏幕面积自动缩放） */
    density?: number
    /** 0 = 完全落下遮住画面，1 = 完全升起 */
    open?: number
  }>(),
  { density: 0.00042, open: 0 },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Star {
  u: number
  v: number
  radius: number
  baseAlpha: number
  twinkleSpeed: number
  twinklePhase: number
  glow: boolean
  driftSpeedU: number
  driftSpeedV: number
  driftPhase: number
  driftAmount: number
}

let ctx: CanvasRenderingContext2D | null = null
let stars: Star[] = []
let frameId = 0
let width = 0
let height = 0
let dpr = 1
let startTime = 0

/** 褶皱数量 */
const FOLDS = 9
/** 裂口弧度：靠近中线的下沿比两侧低多少（占画面比例） */
const CURVE = 0.3
/** 拉到最开时，V 字还保留多少高度（占画面比例）。0 = 完全消失，0.22 = 留下明显轮廓 */
const V_KEEP = 0.22

/** 褶皱横向位移 */
function foldOffset(x: number, amplitude: number) {
  const t = (x / width) * Math.PI * 2 * FOLDS
  return Math.sin(t) * amplitude
}

/** 褶皱明暗 */
function foldShade(x: number) {
  const t = (x / width) * Math.PI * 2 * FOLDS
  return Math.cos(t)
}

/**
 * 裂口边缘的纵向位置，形成 |\/| 的形状：
 * 中线处最低（顶点朝下），越往两侧下沿抬得越高，
 * 于是缝是一个向上张开的楔形，像幕布从中间向两边翻起。
 *
 * 注意：两侧最多升到 MAX_RISE 处就停住，不会完全退出画面，
 * 所以拉到最开时画面上下仍保留一个 V 字形轮廓。
 * 返回该 x 处「布的下沿」所在的 y（下沿以上是布，以下是首页）。
 */
function hemYAt(x: number) {
  // 归一化到 -1(左) ~ 0(中) ~ 1(右)
  const nx = (x / width) * 2 - 1
  // 距中线的横向距离 0(中) ~ 1(两边)
  const d = Math.min(1, Math.abs(nx))

  // 中线保持最低，两侧随距离抬起；用幂次让靠近中线的一段变化更柔和
  const eased = Math.pow(d, 1.35)

  // 中线处下沿的位置：从画面底部升到接近顶部，但留出 V 字的高度
  const base = height * (1 - props.open * (1 - V_KEEP))

  // 两侧抬升量：封顶在画面高度的一部分，保证 V 字不会被拉没
  const rise = height * props.open * (V_KEEP + CURVE) * eased

  return base - rise
}

/** 勾勒帘幕轮廓：上方顶到画布外，下沿走弧线 */
function curtainPath() {
  if (!ctx) return
  ctx.beginPath()
  const steps = 64
  ctx.moveTo(0, -height)
  ctx.lineTo(0, hemYAt(0))
  for (let i = 0; i <= steps; i++) {
    const x = (width * i) / steps
    ctx.lineTo(x, hemYAt(x))
  }
  ctx.lineTo(width, -height)
  ctx.closePath()
}

function createStars(count: number) {
  const list: Star[] = []
  for (let i = 0; i < count; i++) {
    const glow = Math.random() < 0.07
    list.push({
      u: Math.random(),
      v: Math.random(),
      radius: glow ? Math.random() * 1.8 + 1.3 : Math.random() * 1.2 + 0.35,
      baseAlpha: glow ? Math.random() * 0.3 + 0.7 : Math.random() * 0.55 + 0.42,
      twinkleSpeed: Math.random() * 1.4 + 0.35,
      twinklePhase: Math.random() * Math.PI * 2,
      glow,
      driftSpeedU: (Math.random() - 0.5) * 0.016,
      driftSpeedV: (Math.random() - 0.5) * 0.012,
      driftPhase: Math.random() * Math.PI * 2,
      driftAmount: Math.random() * 0.022 + 0.006,
    })
  }
  stars = list
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = rect.width
  height = rect.height
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  createStars(Math.round(width * height * props.density))
}

/** 画帘幕的夜空质感（底色 + 星云 + 褶皱） */
function paintCurtain() {
  if (!ctx) return

  const crease = Math.min(1, Math.max(0, (props.open - 0.03) / 0.45))

  ctx.save()
  curtainPath()
  ctx.clip()

  // 底色 + 星云
  ctx.fillStyle = '#03060f'
  ctx.fillRect(0, 0, width, height)

  const nebulaA = ctx.createRadialGradient(
    width * 0.22, height * 0.3, 0,
    width * 0.22, height * 0.3, Math.max(width, height) * 0.62,
  )
  nebulaA.addColorStop(0, 'rgba(22, 48, 104, 0.5)')
  nebulaA.addColorStop(0.5, 'rgba(12, 28, 66, 0.24)')
  nebulaA.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = nebulaA
  ctx.fillRect(0, 0, width, height)

  const nebulaB = ctx.createRadialGradient(
    width * 0.78, height * 0.72, 0,
    width * 0.78, height * 0.72, Math.max(width, height) * 0.58,
  )
  nebulaB.addColorStop(0, 'rgba(16, 36, 88, 0.42)')
  nebulaB.addColorStop(0.55, 'rgba(10, 22, 54, 0.18)')
  nebulaB.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = nebulaB
  ctx.fillRect(0, 0, width, height)

  if (crease > 0) {
    const step = 2
    for (let x = 0; x < width; x += step) {
      const t = (x / width) * Math.PI * 2 * FOLDS
      const raw = Math.cos(t)
      const s = Math.sign(raw) * Math.pow(Math.abs(raw), 0.7)
      if (s > 0) {
        ctx.fillStyle = `rgba(150, 195, 255, ${s * 0.15 * crease})`
      } else {
        ctx.fillStyle = `rgba(0, 0, 4, ${-s * 0.45 * crease})`
      }
      ctx.fillRect(x, 0, step, height)
    }

    const top = ctx.createLinearGradient(0, 0, 0, height * 0.6)
    top.addColorStop(0, `rgba(16, 30, 66, ${0.85 * crease})`)
    top.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, width, height * 0.6)

    // 下摆的柔和垂坠：沿弧线给一道淡淡的厚度，不要压得太黑
    ctx.save()
    curtainPath()
    ctx.clip()
    ctx.lineWidth = 110
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(0, 0, 4, ${0.3 * crease})`
    ctx.beginPath()
    const steps = 64
    for (let i = 0; i <= steps; i++) {
      const x = (width * i) / steps
      if (i === 0) ctx.moveTo(x, hemYAt(x))
      else ctx.lineTo(x, hemYAt(x))
    }
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

/** 画星星（只画在帘幕区域内） */
function drawStars(elapsed: number) {
  if (!ctx) return

  ctx.save()
  curtainPath()
  ctx.clip()

  const crease = Math.min(1, Math.max(0, (props.open - 0.03) / 0.45))

  for (const star of stars) {
    const wanderU = Math.sin(elapsed * star.driftSpeedU * 6 + star.driftPhase) * star.driftAmount
    const wanderV = Math.cos(elapsed * star.driftSpeedV * 6 + star.driftPhase) * star.driftAmount * 0.7

    let x = ((star.u + wanderU + 1) % 1) * width
    // 星星跟随布面运动：向两侧散开，同时随布一起被提起
    const half = width / 2
    if (x < half) {
      const k = 1 - x / Math.max(half, 1)
      x -= props.open * (width * 0.5) * (1 - k * 0.4)
    } else {
      const k = (x - half) / Math.max(half, 1)
      x += props.open * (width * 0.5) * (1 - k * 0.4)
    }
    const yBase = ((star.v + wanderV + 1) % 1) * height
    // 竖直方向跟随该处布面的抬升：越靠两侧抬得越多，星星才不会跑出布外
    const dist = Math.min(1, Math.abs((x / width) * 2 - 1))
    const y = yBase - height * props.open * (1 + CURVE) * Math.pow(dist, 1.35)

    let shade = 1
    if (crease > 0) {
      x += foldOffset(x, 10) * crease
      shade = 1 - crease * (1 - (0.55 + 0.45 * (foldShade(x) * 0.5 + 0.5)))
    }

    const twinkle = Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7
    const alpha = Math.max(0, Math.min(1, star.baseAlpha * twinkle * shade))
    if (alpha <= 0.01) continue

    if (star.glow) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, star.radius * 7)
      halo.addColorStop(0, `rgba(210, 232, 255, ${alpha * 0.6})`)
      halo.addColorStop(0.4, `rgba(140, 190, 255, ${alpha * 0.22})`)
      halo.addColorStop(1, 'rgba(90, 150, 255, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(x, y, star.radius * 7, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = `rgba(245, 250, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, star.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function draw(timestamp: number) {
  if (!ctx) return
  if (!startTime) startTime = timestamp
  const elapsed = (timestamp - startTime) / 1000

  // 清成透明，帘幕之外才能透出后面的首页
  ctx.clearRect(0, 0, width, height)

  paintCurtain()
  drawStars(elapsed)

  frameId = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  frameId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="star-field" aria-hidden="true" />
</template>

<style scoped>
.star-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
