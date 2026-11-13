<script setup lang="ts">
import type { Device } from '@cairn/core'

/**
 * iPhone with a live Lock Screen. Every size is in iOS points (--u = 1pt on screen),
 * so the frame, island and clock keep real proportions on every model.
 */
const props = defineProps<{ device: Device, svg?: string, timeZone: string, now: Date, compactClock?: boolean }>()

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
    :class="[island ? 'is-island' : 'is-notch', { 'is-compact': compactClock }]"
    :style="{ '--w': width, '--h': device.height / device.scale, '--r': CORNER[device.id] ?? 55 }"
    :aria-label="`Lock Screen preview: ${date}, ${time}`"
  >
    <span v-if="island" class="key key--action" />
    <span class="key key--volume-up" />
    <span class="key key--volume-down" />
    <span class="key key--side" />

    <div class="screen">
      <div v-if="svg" class="wallpaper" v-html="svg" />

      <div class="lock" aria-hidden="true">
        <div class="cutout" />

        <div class="status">
          <svg viewBox="0 0 18 12" class="status-icon"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
          <svg viewBox="0 0 16 12" class="status-icon"><path d="M8 2.3c2.4 0 4.6.9 6.2 2.5l1.2-1.2A10.3 10.3 0 0 0 8 .5 10.3 10.3 0 0 0 .6 3.6l1.2 1.2A8.7 8.7 0 0 1 8 2.3m0 3.5c1.4 0 2.8.6 3.8 1.5l1.2-1.2A7.1 7.1 0 0 0 8 4a7.1 7.1 0 0 0-5 2.1l1.2 1.2A5.4 5.4 0 0 1 8 5.8m0 3.4c.6 0 1.1.2 1.5.6L8 11.5 6.5 9.8c.4-.4.9-.6 1.5-.6" /></svg>
          <svg viewBox="0 0 27 13" class="status-icon status-icon--battery"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="9" rx="2.5" /><path d="M25 4.5v4a2.2 2.2 0 0 0 0-4" opacity=".4" /></svg>
        </div>

        <!-- iOS 27 compact clock: the time moves into the date row. -->
        <p class="date">
          <span v-if="compactClock" class="date-time">{{ time }}</span>{{ date }}
        </p>
        <p v-if="!compactClock" class="clock">{{ time }}</p>

        <span class="quick quick--left">
          <UIcon name="i-lucide-flashlight" class="quick-icon" />
        </span>
        <span class="quick quick--right">
          <UIcon name="i-lucide-camera" class="quick-icon" />
        </span>
        <span class="home" />
      </div>
    </div>
  </figure>
</template>

<style scoped lang="scss">
// Titanium frame shades, only used by this mockup.
$titanium-light: #8D8A86;
$titanium-mid: #5C5A57;
$titanium-dark: #2D2C2A;
$key-light: #6E6B67;
$key-dark: #3A3937;

// Points to page pixels: 1pt on the device = --u on the page.
@function pt($value) {
  @return calc(var(--u) * #{$value});
}

.phone {
  --screen: min(300px, calc(100vw - 72px));
  --u: calc(var(--screen) / var(--w));
  --edge: #{pt(3)};
  --bezel: #{pt(5.5)};

  position: relative;
  width: calc(var(--screen) + 2 * (var(--edge) + var(--bezel)));
  margin: $spacer-0 auto;
  padding: var(--edge);
  border-radius: calc(var(--u) * var(--r) + var(--edge) + var(--bezel));
  // Titanium band: light catches the top-left edge.
  background: linear-gradient(135deg, $titanium-light 0%, $key-dark 22%, $titanium-mid 50%, $titanium-dark 78%, $titanium-light 100%);
  box-shadow:
    0 0 0 0.5px rgba($white, 0.15) inset,
    0 40px 80px -20px rgba($black, 0.9),
    0 0 0 1px rgba($black, 0.6);
}

.key {
  position: absolute;
  left: calc(-1 * var(--edge));
  width: pt(3);
  border-radius: pt(2) 0 0 pt(2);
  background: linear-gradient(90deg, $key-light, $key-dark);

  &--action {
    top: pt(150);
    height: pt(30);
  }

  &--volume-up {
    top: pt(210);
    height: pt(58);
  }

  &--volume-down {
    top: pt(285);
    height: pt(58);
  }

  &--side {
    top: pt(240);
    right: calc(-1 * var(--edge));
    left: auto;
    height: pt(95);
    border-radius: 0 pt(2) pt(2) 0;
    background: linear-gradient(270deg, $key-light, $key-dark);
  }
}

.screen {
  position: relative;
  box-sizing: content-box;
  width: var(--screen);
  overflow: hidden;
  aspect-ratio: var(--w) / var(--h);
  border: var(--bezel) solid $black;
  border-radius: calc(var(--u) * var(--r) + var(--bezel));
  background-color: $black;
}

.wallpaper {
  position: absolute;
  inset: 0;

  :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.lock {
  position: absolute;
  inset: 0;
  font-family: $font-display;
  color: $white;
  pointer-events: none;
  user-select: none;
  // Faint glass reflection.
  background: linear-gradient(160deg, rgba($white, 0.06) 0%, transparent 35%);
}

.cutout {
  position: absolute;
  left: 50%;
  translate: -50% 0;
  background-color: $black;

  .is-island & {
    top: pt(11);
    width: pt(125);
    height: pt(37);
    border-radius: $radius-pill;
  }

  .is-notch & {
    top: 0;
    width: pt(162);
    height: pt(32);
    border-radius: 0 0 pt(20) pt(20);
  }
}

.status {
  position: absolute;
  right: pt(30);
  display: flex;
  align-items: center;
  gap: pt(5);
  fill: currentColor;

  .is-island & {
    top: pt(23);
  }

  .is-notch & {
    top: pt(14);
  }
}

.status-icon {
  height: pt(11);

  &--battery {
    height: pt(12.5);
  }
}

.date,
.clock {
  position: absolute;
  inset-inline: 0;
  margin: $spacer-0;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.date {
  font-size: pt(21);
  font-weight: $font-weight-semibold;
  opacity: 0.85;

  .is-island & {
    top: pt(66);
  }

  .is-notch & {
    top: pt(56);
  }
}

.date-time {
  margin-right: pt(8);
  font-weight: $font-weight-bold;
}

// Liquid Glass clock (iOS 26+): rounded numerals filled with translucent light, a bright rim and a soft drop shadow.
.clock {
  font-size: pt(110);
  font-weight: $font-weight-bold;
  line-height: 1;
  letter-spacing: -0.01em;
  color: transparent;
  background: linear-gradient(180deg, rgba($white, 0.92) 0%, rgba($white, 0.55) 55%, rgba($white, 0.75) 100%);
  background-clip: text;
  -webkit-background-clip: text;

  .is-island & {
    top: pt(92);
  }

  .is-notch & {
    top: pt(82);
  }
}

.quick {
  position: absolute;
  bottom: pt(44);
  display: grid;
  place-items: center;
  width: pt(50);
  height: pt(50);
  border-radius: $radius-pill;
  // Liquid Glass control: blurred, saturated backdrop with a specular top edge.
  background: linear-gradient(180deg, rgba($white, 0.2), rgba($white, 0.08));
  box-shadow:
    inset 0 0.5px 0 rgba($white, 0.55),
    inset 0 -0.5px 0 rgba($white, 0.15),
    0 pt(4) pt(12) rgba($black, 0.25);
  backdrop-filter: blur(12px) saturate(180%);

  &--left {
    left: pt(46);
  }

  &--right {
    right: pt(46);
  }
}

.quick-icon {
  width: pt(22);
  height: pt(22);
}

.home {
  position: absolute;
  bottom: pt(8);
  left: 50%;
  width: pt(140);
  height: pt(5);
  translate: -50% 0;
  border-radius: $radius-pill;
  background-color: $white;
}
</style>
