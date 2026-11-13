<script setup lang="ts">
import type { Device } from '@cairn/core'

/**
 * iPhone with a live Lock Screen. Every size is in iOS points (--u = 1pt on screen),
 * so the frame, island and clock keep real proportions on every model.
 */
const props = defineProps<{ device: Device, svg?: string, timeZone: string, now: Date }>()

// Display corner radius in points per resolution group (measured values published for each model).
const CORNER: Record<string, number> = {
  'iphone-5.4': 44,
  'iphone-6.1-notch': 47.33,
  'iphone-6.1': 55,
  'iphone-6.3': 62,
  'iphone-6.5': 62,
  'iphone-6.7-notch': 53.33,
  'iphone-6.7': 55,
  'iphone-6.9': 62,
}

const width = computed(() => props.device.width / props.device.scale)
const island = computed(() => props.device.cutout === 'island')

const time = computed(() =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: props.timeZone })
    .formatToParts(props.now)
    .filter(p => p.type !== 'dayPeriod') // the Lock Screen never shows AM/PM
    .map(p => p.value)
    .join('')
    .trim())

const date = computed(() => {
  const text = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: props.timeZone }).format(props.now)
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
})
</script>

<template>
  <figure
    class="phone"
    :class="island ? 'is-island' : 'is-notch'"
    :style="{ '--w': width, '--h': device.height / device.scale, '--r': CORNER[device.id] ?? 55 }"
    :aria-label="`Lock Screen preview: ${date}, ${time}`"
  >
    <span v-if="island" class="key" style="left: calc(-1 * var(--edge)); top: calc(var(--u) * 150); height: calc(var(--u) * 30)" />
    <span class="key" style="left: calc(-1 * var(--edge)); top: calc(var(--u) * 210); height: calc(var(--u) * 58)" />
    <span class="key" style="left: calc(-1 * var(--edge)); top: calc(var(--u) * 285); height: calc(var(--u) * 58)" />
    <span class="key key--right" style="top: calc(var(--u) * 240); height: calc(var(--u) * 95)" />

    <div class="screen">
      <div v-if="svg" class="wallpaper" v-html="svg" />

      <div class="lock" aria-hidden="true">
        <div class="cutout" />

        <div class="status">
          <svg viewBox="0 0 18 12" class="h-[calc(var(--u)*11)]"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg viewBox="0 0 16 12" class="h-[calc(var(--u)*11)]"><path d="M8 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.3 10.3 0 0 0 8 .5 10.3 10.3 0 0 0 .6 3.6l1.2 1.2A8.7 8.7 0 0 1 8 2.3m0 3.5c1.4 0 2.8.6 3.8 1.5l1.2-1.2A7.1 7.1 0 0 0 8 4a7.1 7.1 0 0 0-5 2.1l1.2 1.2A5.4 5.4 0 0 1 8 5.8m0 3.4c.6 0 1.1.2 1.5.6L8 11.5 6.5 9.8c.4-.4.9-.6 1.5-.6" /></svg>
          <svg viewBox="0 0 27 13" class="h-[calc(var(--u)*12.5)]"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="9" rx="2.5" /><path d="M25 4.5v4a2.2 2.2 0 0 0 0-4" opacity=".4" /></svg>
        </div>

        <p class="date">{{ date }}</p>
        <p class="clock">{{ time }}</p>

        <span class="quick" style="left: calc(var(--u) * 46)">
          <UIcon name="i-lucide-flashlight" class="size-[calc(var(--u)*22)]" />
        </span>
        <span class="quick" style="right: calc(var(--u) * 46)">
          <UIcon name="i-lucide-camera" class="size-[calc(var(--u)*22)]" />
        </span>
        <span class="home" />
      </div>
    </div>
  </figure>
</template>

<style scoped>
.phone {
  /* Screen width drives everything: 1pt on the device = --u on the page. */
  --screen: min(300px, calc(100vw - 72px));
  --u: calc(var(--screen) / var(--w));
  --edge: calc(var(--u) * 3);
  --bezel: calc(var(--u) * 5.5);
  position: relative;
  width: calc(var(--screen) + 2 * (var(--edge) + var(--bezel)));
  margin: 0 auto;
  padding: var(--edge);
  border-radius: calc(var(--u) * var(--r) + var(--edge) + var(--bezel));
  /* Titanium band: light catches the top-left edge. */
  background: linear-gradient(135deg, #8d8a86 0%, #3b3a38 22%, #5c5a57 50%, #2d2c2a 78%, #77746f 100%);
  box-shadow:
    0 0 0 0.5px rgb(255 255 255 / 0.15) inset,
    0 40px 80px -20px rgb(0 0 0 / 0.9),
    0 0 0 1px rgb(0 0 0 / 0.6);
}

.key {
  position: absolute;
  width: calc(var(--u) * 3);
  border-radius: calc(var(--u) * 2) 0 0 calc(var(--u) * 2);
  background: linear-gradient(90deg, #6e6b67, #3a3937);
}

.key--right {
  right: calc(-1 * var(--edge));
  border-radius: 0 calc(var(--u) * 2) calc(var(--u) * 2) 0;
  background: linear-gradient(270deg, #6e6b67, #3a3937);
}

.screen {
  position: relative;
  overflow: hidden;
  border: var(--bezel) solid #000;
  border-radius: calc(var(--u) * var(--r) + var(--bezel));
  background: #000;
  aspect-ratio: var(--w) / var(--h);
  box-sizing: content-box;
  width: var(--screen);
}

.wallpaper :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.wallpaper {
  position: absolute;
  inset: 0;
}

.lock {
  position: absolute;
  inset: 0;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
  pointer-events: none;
  user-select: none;
  /* Faint glass reflection. */
  background: linear-gradient(160deg, rgb(255 255 255 / 0.06) 0%, transparent 35%);
}

.cutout {
  position: absolute;
  left: 50%;
  translate: -50% 0;
  background: #000;
}

.is-island .cutout {
  top: calc(var(--u) * 11);
  width: calc(var(--u) * 125);
  height: calc(var(--u) * 37);
  border-radius: 999px;
}

.is-notch .cutout {
  top: 0;
  width: calc(var(--u) * 162);
  height: calc(var(--u) * 32);
  border-radius: 0 0 calc(var(--u) * 20) calc(var(--u) * 20);
}

.status {
  position: absolute;
  right: calc(var(--u) * 30);
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 5);
  fill: currentColor;
}

.is-island .status { top: calc(var(--u) * 23); }
.is-notch .status { top: calc(var(--u) * 14); }

.date,
.clock {
  position: absolute;
  inset-inline: 0;
  margin: 0;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.date {
  font-size: calc(var(--u) * 21);
  font-weight: 600;
  opacity: 0.85;
}

.clock {
  font-size: calc(var(--u) * 104);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  opacity: 0.92;
}

.is-island .date { top: calc(var(--u) * 66); }
.is-island .clock { top: calc(var(--u) * 92); }
.is-notch .date { top: calc(var(--u) * 56); }
.is-notch .clock { top: calc(var(--u) * 82); }

.quick {
  position: absolute;
  bottom: calc(var(--u) * 44);
  display: grid;
  width: calc(var(--u) * 50);
  height: calc(var(--u) * 50);
  place-items: center;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  backdrop-filter: blur(12px);
}

.home {
  position: absolute;
  bottom: calc(var(--u) * 8);
  left: 50%;
  width: calc(var(--u) * 140);
  height: calc(var(--u) * 5);
  translate: -50% 0;
  border-radius: 999px;
  background: #fff;
}
</style>
