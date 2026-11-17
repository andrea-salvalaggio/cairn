<script setup lang="ts">
import type { Device } from '@cairn/core'

/**
 * iPhone with a live Lock Screen. Every size is in iOS points (--u = 1pt on screen),
 * so the frame, island and clock keep real proportions on every model.
 */
// theme keys the wallpaper: a new theme crossfades, while color and date edits update in place.
const props = defineProps<{ device: Device, svg?: string, theme?: string, timeZone: string, now: Date, compactClock?: boolean }>()

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

// 24-hour clock with a leading zero (09:06), whatever the browser locale.
const time = computed(() =>
    new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: props.timeZone }).format(props.now))
// The large clock spaces the colon apart (dx in the template), so it needs the two halves.
const hours = computed(() => time.value.slice(0, 2))
const minutes = computed(() => time.value.slice(-2))

// English like the rest of the site, whatever the browser locale: "Tuesday, November 17".
const date = computed(() =>
    new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', timeZone: props.timeZone }).format(props.now))
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
            <Transition name="wallpaper">
                <div v-if="svg" :key="theme" class="wallpaper" v-html="svg" />
            </Transition>

            <div class="lock" aria-hidden="true">
                <div class="cutout" />

                <div class="status">
                    <svg viewBox="0 0 18 12" class="status-icon"><rect x="0" y="7.5" width="3.4" height="4.5" rx="1.2" /><rect x="4.9" y="5" width="3.4" height="7" rx="1.2" /><rect x="9.8" y="2.5" width="3.4" height="9.5" rx="1.2" /><rect x="14.6" y="0" width="3.4" height="12" rx="1.2" opacity=".35" /></svg>
                    <span class="status-network">5G</span>
                    <!-- iOS battery: translucent body, level fill with a straight edge. -->
                    <svg viewBox="0 0 29 13" class="status-icon status-icon--battery"><rect width="26" height="13" rx="4" opacity=".35" /><path d="M4 0h16.8v13H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4" /><path d="M27.3 4.5v4a2 2 0 0 0 0-4" opacity=".35" /></svg>
                </div>

                <!-- iOS 27 compact clock: the time moves into the date row. Both clocks stay mounted so the switch can animate. -->
                <p class="date">
                    <span class="date-time">{{ time }}</span>{{ date }}
                </p>
                <!-- x offset recentres the -1.5 letter-spacing. SVG text so the numerals get a round-joined stroke: softly rounded corners, like the iOS clock. -->
                <svg class="clock" :viewBox="`0 0 ${width} 124`"><text :x="width / 2 - 0.75" y="104" text-anchor="middle">{{ hours }}<tspan dx="5">:</tspan><tspan dx="5">{{ minutes }}</tspan></text></svg>

                <span class="quick quick--left">
                    <svg viewBox="0 0 24 24" class="quick-icon"><path fill-rule="evenodd" d="M7.5 1.5h9A1.5 1.5 0 0 1 18 3v2H6V3a1.5 1.5 0 0 1 1.5-1.5M6 6h12l-2.4 5a2.5 2.5 0 0 0-.3 1.1V21a1.5 1.5 0 0 1-1.5 1.5h-3.6A1.5 1.5 0 0 1 8.7 21v-8.9a2.5 2.5 0 0 0-.3-1.1zm6 7.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 1 0 0-2.8" /></svg>
                </span>
                <span class="quick quick--right">
                    <svg viewBox="0 0 24 24" class="quick-icon"><path fill-rule="evenodd" d="M9.2 3.5h5.6a1.5 1.5 0 0 1 1.3.8L17 6h2.5A2.5 2.5 0 0 1 22 8.5v10a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-10A2.5 2.5 0 0 1 4.5 6H7l.9-1.7a1.5 1.5 0 0 1 1.3-.8M12 8.8a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 1 0 0-8.8m0 2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 1 1 0-4.8" /></svg>
                </span>
                <span class="home" />
            </div>
        </div>
    </figure>
</template>

<style scoped lang="scss">
$titanium-light: #8D8A86;
$titanium-mid: #5C5A57;
$titanium-dark: #2D2C2A;
$key-light: #6E6B67;
$key-dark: #3A3937;

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

.wallpaper-enter-active,
.wallpaper-leave-active {
    transition: opacity 200ms ease, filter 200ms ease;
}

.wallpaper-enter-from,
.wallpaper-leave-to {
    opacity: 0;
    filter: blur(2px);
}

.lock {
    position: absolute;
    inset: 0;
    font-family: $font-display;
    color: $white;
    pointer-events: none;
    user-select: none;
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
    top: pt(20);
    right: pt(28);
    display: flex;
    align-items: center;
    gap: pt(6);
    fill: currentColor;
}

.status-icon {
    height: pt(12);

    &--battery {
        height: pt(13);
    }
}

.status-network {
    font-size: pt(15);
    font-weight: $font-weight-semibold;
    line-height: 1;
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
    top: pt(91);
    font-size: pt(24);
    font-weight: $font-weight-medium;
    line-height: 1;
}

.date-time {
    display: inline-block;
    overflow: hidden;
    max-width: 0;
    vertical-align: bottom;
    font-weight: $font-weight-bold;
    white-space: nowrap;
    opacity: 0;
    transition: max-width 0.3s $ease-out, margin-right 0.3s $ease-out, opacity 0.2s ease;

    .is-compact & {
        max-width: pt(90);
        margin-right: pt(8);
        opacity: 1;
        transition-delay: 0.05s;
    }
}

.clock {
    top: pt(110);
    width: 100%;
    overflow: visible;
    font-size: 120px;
    font-weight: $font-weight-semibold;
    letter-spacing: -1.5px;
    font-variant-numeric: proportional-nums;
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 3px;
    stroke-linejoin: round;
    transform-origin: 50% 0;
    transition: transform 0.3s $ease-out, opacity 0.25s ease;

    .is-compact & {
        opacity: 0;
        transform: translateY(pt(-24)) scale(0.6);
    }
}

.date-time,
.clock {
    @include reduced-motion {
        transition: opacity 0.2s ease;
    }
}

.quick {
    position: absolute;
    bottom: pt(51);
    display: grid;
    place-items: center;
    width: pt(57);
    height: pt(57);
    border-radius: $radius-pill;
    background: rgba($grouped, 0.72);
    box-shadow:
        inset 0 pt(1) pt(0.5) rgba($white, 0.22),
        inset 0 pt(-1) pt(0.5) rgba($white, 0.1),
        inset 0 0 0 pt(0.5) rgba($white, 0.08);
    backdrop-filter: blur(20px) saturate(160%);

    &--left {
        left: pt(47);
    }

    &--right {
        right: pt(47);
    }
}

.quick-icon {
    width: pt(30);
    height: pt(30);
    fill: currentColor;
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
