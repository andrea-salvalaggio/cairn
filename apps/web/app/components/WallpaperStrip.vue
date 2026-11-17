<script setup lang="ts">
/**
 * Phones only: once the mockup scrolls away, a bar pinned to the top keeps the stones in view while the user edits.
 * It shows the same SVG as the mockup, cropped to the title, stones and counter.
 */
const props = defineProps<{ svg?: string, title: string, shown: boolean }>()
const emit = defineEmits<{ reveal: [] }>()

const thumb = useTemplateRef('thumb')

// The crop depends on the theme and the device, so it is measured from the rendered SVG rather than hardcoded.
// shortcut: getBBox returns zeros while the bar is display:none (desktop), so a window resized into phone width keeps a stale crop until the next change.
watchPostEffect(() => {
    if (!props.svg) return
    const svg = thumb.value?.querySelector('svg')
    if (!svg) return
    const boxes = ['#title', '#dots', '#counter'].map(q => svg.querySelector<SVGGraphicsElement>(q)?.getBBox()).filter(b => b && b.width)
    if (!boxes.length) return
    const pad = 40
    const left = Math.min(...boxes.map(b => b!.x)) - pad
    const top = Math.min(...boxes.map(b => b!.y)) - pad
    const right = Math.max(...boxes.map(b => b!.x + b!.width)) + pad
    const bottom = Math.max(...boxes.map(b => b!.y + b!.height)) + pad
    svg.setAttribute('viewBox', `${left} ${top} ${right - left} ${bottom - top}`)
})
</script>

<template>
    <button type="button" class="strip" :class="{ 'is-shown': shown }" :inert="!shown" aria-label="Back to the Lock Screen preview" @click="emit('reveal')">
        <span ref="thumb" class="strip-thumb" aria-hidden="true" v-html="svg" />
        <span class="strip-text">
            <span class="strip-title">{{ title }}</span>
            <span class="strip-sub">Tap to see the full Lock Screen</span>
        </span>
        <span class="strip-up" aria-hidden="true"><UIcon name="i-lucide-chevron-up" /></span>
    </button>
</template>

<style scoped lang="scss">
.strip {
    position: fixed;
    inset: 0 0 auto;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: $spacer-3;
    width: 100%;
    padding: calc(env(safe-area-inset-top, 0px) + 10px) max($spacer, env(safe-area-inset-right, 0px)) 10px max($spacer, env(safe-area-inset-left, 0px));
    font: inherit;
    text-align: left;
    color: $label;
    cursor: pointer;
    border: 0;
    border-bottom: 0.5px solid $separator;
    background-color: rgba($grouped, 0.82);
    backdrop-filter: blur(20px) saturate(160%);
    opacity: 0;
    transform: translateY(-100%);
    transition: transform 240ms $ease-out, opacity 180ms ease;
    pointer-events: none;

    &.is-shown {
        opacity: 1;
        transform: none;
        pointer-events: auto;
    }

    &:active .strip-thumb {
        transform: scale(0.97);
    }

    &:focus-visible {
        outline: 2px solid $tint;
        outline-offset: -2px;
    }

    @include reduced-motion {
        transform: none;
        transition: opacity 180ms ease;
    }

    @include up($bp-md) {
        display: none;
    }
}

.strip-thumb {
    flex-shrink: 0;
    width: 7.5rem;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 0.625rem;
    box-shadow: inset 0 0 0 0.5px rgba($white, 0.12);
    transition: transform 160ms $ease-out;

    :deep(svg) {
        display: block;
        width: 100%;
        height: 100%;
    }
}

.strip-text {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.strip-title {
    overflow: hidden;
    font-size: $font-size-subhead;
    font-weight: $font-weight-semibold;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.strip-sub {
    font-size: $font-size-footnote;
    color: $label-secondary;
}

.strip-up {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 28px;
    height: 28px;
    margin-left: auto;
    color: $label-secondary;
    border-radius: $radius-pill;
    background-color: $fill;
}
</style>
