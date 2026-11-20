<script setup lang="ts">
import { DEFAULT_ACCENT } from '@cairn/core'

/**
 * Accent color: a swatch and hex code that open a popover with quick picks and the full picker,
 * like DateField's calendar. The form keeps a plain uppercase hex string.
 */
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ required: true })

// Cairn's ochre first, then iOS system colors that read well on the dark wallpaper.
const PRESETS = [
    { name: 'Ochre', hex: DEFAULT_ACCENT },
    { name: 'Red', hex: '#FF453A' },
    { name: 'Pink', hex: '#FF375F' },
    { name: 'Purple', hex: '#BF5AF2' },
    { name: 'Blue', hex: '#0A84FF' },
    { name: 'Teal', hex: '#40C8E0' },
    { name: 'Green', hex: '#30D158' },
]

const hex = computed({
    get: () => model.value.toUpperCase(),
    set: (value: string | undefined) => { if (value) model.value = value.toUpperCase() },
})
</script>

<template>
    <div class="color-field">
        <UPopover :content="{ align: 'start', sideOffset: 8, positionStrategy: 'absolute' }">
            <button type="button" class="color-trigger" v-bind="$attrs">
                <span class="color-dot" :style="{ backgroundColor: hex }" />
                <span class="color-hex">{{ hex }}</span>
            </button>
            <template #content>
                <div class="color-panel">
                    <div class="color-presets" role="group" aria-label="Quick colors">
                        <button
                            v-for="p in PRESETS"
                            :key="p.hex"
                            type="button"
                            class="color-preset"
                            :class="{ 'color-preset--active': p.hex === hex }"
                            :style="{ backgroundColor: p.hex }"
                            :aria-label="p.name"
                            :aria-pressed="p.hex === hex"
                            @click="hex = p.hex"
                        />
                    </div>
                    <UColorPicker v-model="hex" />
                </div>
            </template>
        </UPopover>
        <button v-if="hex !== DEFAULT_ACCENT" type="button" class="color-reset" @click="hex = DEFAULT_ACCENT">
            Reset
        </button>
    </div>
</template>

<style lang="scss">
.color-field {
    display: flex;
    flex: 1;
    align-items: center;
    gap: $spacer-2;
    min-width: 0;
}

.color-trigger {
    display: flex;
    flex: 1;
    align-items: center;
    gap: $spacer-2;
    height: $row-height;
    padding: $spacer-0;
    font: inherit;
    color: $label;
    text-align: left;
    cursor: pointer;
    border: 0;
    outline: none;
    background: none;
}

.color-dot {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: $radius-pill;
    box-shadow: inset 0 0 0 1px rgba($white, 0.2);
}

.color-hex {
    font-variant-numeric: tabular-nums;
}

.color-reset {
    flex-shrink: 0;
    padding: $spacer-1 $spacer-0;
    font: inherit;
    font-size: $font-size-subhead;
    color: $tint;
    cursor: pointer;
    border: 0;
    background: none;
}

.color-panel {
    display: flex;
    flex-direction: column;
    gap: $spacer-3;
    padding: $spacer-3;
}

.color-presets {
    display: flex;
    justify-content: space-between;
    gap: $spacer-2;
}

.color-preset {
    width: 1.5rem;
    height: 1.5rem;
    padding: $spacer-0;
    cursor: pointer;
    border: 0;
    border-radius: $radius-pill;
    transition: transform 120ms $ease-out;

    &--active {
        outline: 2px solid $label;
        outline-offset: 2px;
    }

    &:active {
        transform: scale(0.9);
    }
}
</style>
