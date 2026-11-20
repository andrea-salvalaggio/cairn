<script setup lang="ts">
import {
    type Config,
    ConfigError,
    DEFAULT_ACCENT,
    DEFAULT_DEVICE,
    DEFAULT_TITLE_FONT,
    TITLE_FONTS,
    type TitleFontId,
    type ThemeId,
    deviceModels,
    encodeConfig,
    stripEmoji,
    getDevice,
    parseConfig,
    render,
    todayInTimeZone,
} from '@cairn/core'

// Live clock: the mockup ticks and the wallpaper rolls over at midnight in the chosen time zone.
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 1000)
onBeforeUnmount(() => clearInterval(timer))

const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const offsetOf = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(now.value).find(p => p.type === 'timeZoneName')?.value ?? ''
// Alphabetical, the detected zone included (it can be an alias the list lacks, like Europe/Kiev); it stays preselected.
const timeZones = [...new Set([detectedZone, ...Intl.supportedValuesOf('timeZone')])].sort()
    .map(zone => ({ zone, label: `${zone.replaceAll('_', ' ')} · ${offsetOf(zone)}` }))

const themes: { label: string, value: ThemeId, icon: string }[] = [
    // Phosphor names: the tab bar needs both a -bold (outline) and a -fill version of each.
    { label: 'Birthday', value: 'birthday', icon: 'cake' },
    { label: 'Anniversary', value: 'anniversary', icon: 'heart' },
    { label: 'Goal', value: 'goal', icon: 'star' },
]
const models = deviceModels()

const initialToday = todayInTimeZone(detectedZone)
const plusDays = (days: number) => todayInTimeZone('UTC', new Date(Date.parse(`${initialToday}T12:00:00Z`) + days * 86_400_000))

// Same defaults as packages/core model.ts, which also uses them when the title is left empty.
const defaultTitles: Record<ThemeId, string> = { birthday: 'My life in years', anniversary: 'Together', goal: 'My goal' }

const form = reactive({
    theme: 'birthday' as ThemeId,
    model: models.find(m => m.deviceId === DEFAULT_DEVICE)!.model,
    timeZone: detectedZone,
    titles: { ...defaultTitles },
    font: DEFAULT_TITLE_FONT as TitleFontId,
    // One accent for every theme: switching theme keeps the color.
    accent: DEFAULT_ACCENT,
    // Dates start empty so nobody ships a wallpaper with a made-up date; the preview fills the gaps from EXAMPLE_DATES.
    birthDate: '',
    anniversaryDate: '',
    goalStart: '',
    goalTarget: '',
})

// Only ever drawn in the preview, picked so the sample pile looks good.
const EXAMPLE_DATES = {
    birthDate: '1995-01-01',
    anniversaryDate: plusDays(-365 * 3 - 120),
    goalStart: initialToday,
    goalTarget: plusDays(88),
}
const REQUIRED_DATES: Record<ThemeId, (keyof typeof EXAMPLE_DATES)[]> = {
    birthday: ['birthDate'],
    anniversary: ['anniversaryDate'],
    goal: ['goalTarget', 'goalStart'],
}
const missingDate = computed(() => REQUIRED_DATES[form.theme].some(key => !form[key]))

// ARIA radio group: Tab reaches only the checked item, arrows move and select.
function onRadioKeys(e: KeyboardEvent) {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key]
    if (!step) return
    e.preventDefault()
    const items = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="radio"]')]
    const next = items[(items.indexOf(e.target as HTMLButtonElement) + step + items.length) % items.length]
    next?.focus()
    next?.click()
}

const today = computed(() => todayInTimeZone(form.timeZone, now.value))
const themeIndex = computed(() => themes.findIndex(t => t.value === form.theme))

const PREVIEW_BG = '#0C0A09'

// The style row fades at an edge only while there is more to scroll that way, so a cut-off chip reads as "more".
const picker = useTemplateRef<HTMLElement>('picker')
const fade = reactive({ start: false, end: false })
function updateFade() {
    const el = picker.value
    if (!el) return
    // A couple of pixels of slack: high-density screens report fractional scroll positions.
    fade.start = el.scrollLeft > 2
    fade.end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}
onMounted(() => {
    updateFade()
    // Chip widths change once the web fonts arrive.
    document.fonts.ready.then(updateFade)
    window.addEventListener('resize', updateFade)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateFade))

const titleHasEmoji = computed(() => stripEmoji(form.titles[form.theme]) !== form.titles[form.theme])

const result = computed<{ config?: Config, svg?: string, error?: ConfigError }>(() => {
    const date = (key: keyof typeof EXAMPLE_DATES) => form[key] || EXAMPLE_DATES[key]
    try {
        const config = parseConfig({
            v: 1,
            theme: form.theme,
            device: models.find(m => m.model === form.model)?.deviceId,
            timeZone: form.timeZone,
            title: form.titles[form.theme],
            font: form.font,
            // Only a custom color goes in the config, so default links stay short.
            colors: form.accent === DEFAULT_ACCENT ? undefined : { accent: form.accent },
            birthDate: form.theme === 'birthday' ? date('birthDate') : undefined,
            startDate: form.theme === 'anniversary' ? date('anniversaryDate') : form.theme === 'goal' ? date('goalStart') : undefined,
            targetDate: form.theme === 'goal' ? date('goalTarget') : undefined,
        })
        // The preview keeps its warm near-black inside the phone frame; the real wallpaper is pure black.
        const svg = render({ ...config, colors: { bg: PREVIEW_BG, ...config.colors } }, today.value)
        return { config, svg }
    }
    catch (error) {
        if (error instanceof ConfigError) return { error }
        throw error
    }
})

// The message for one config key, shown under its field in place of the hint.
// Hidden while a date is missing: the error could come from an example date the user never typed.
const fieldError = (field: keyof Config) => (!missingDate.value && result.value.error?.field === field ? result.value.error.message : undefined)

const device = computed(() => getDevice(result.value.config?.device ?? DEFAULT_DEVICE))
// An example date makes a preview, never a link or a download.
const pngPath = computed(() => (result.value.config && !missingDate.value ? `/w/${encodeConfig(result.value.config)}.png` : undefined))
const liveUrl = computed(() => (pngPath.value ? new URL(pngPath.value, window.location.origin).toString() : ''))
const guideOpen = ref(false)

const contacts = [
    { label: 'Email', icon: 'i-fa7-solid-envelope', href: 'mailto:andrea.salvalaggio95@gmail.com' },
    { label: 'LinkedIn', icon: 'i-fa7-brands-linkedin-in', href: 'https://linkedin.com/in/andrea-salvalaggio' },
    { label: 'GitHub', icon: 'i-fa7-brands-github', href: 'https://github.com/andrea-salvalaggio' },
]

// The download gives no sign of its own, so the button says it started for a moment.
const downloaded = ref(false)
let resetDownloaded: ReturnType<typeof setTimeout> | undefined
function onDownload() {
    downloaded.value = true
    clearTimeout(resetDownloaded)
    resetDownloaded = setTimeout(() => (downloaded.value = false), 2000)
}
onBeforeUnmount(() => clearTimeout(resetDownloaded))
</script>

<template>
    <main class="editor">
        <div class="workspace">
            <header class="intro">
                <h1><CairnLogo /></h1>
                <p>A wallpaper that grows, <span class="intro-line">one stone at a time.</span></p>
            </header>

            <div class="ios-segmented ios-segmented--pill themes" role="radiogroup" aria-label="Wallpaper type" @keydown="onRadioKeys"
                :style="{ '--i': themeIndex, '--n': themes.length }">
                <span class="ios-segmented-thumb" aria-hidden="true" />
                <button v-for="t in themes" :key="t.value" type="button" role="radio"
                    :aria-checked="form.theme === t.value" :tabindex="form.theme === t.value ? 0 : -1" class="ios-segmented-item" @click="form.theme = t.value">
                    <!-- Both rendered, CSS shows one: no icon fetch or flash when the selection changes. -->
                    <UIcon :name="`i-ph-${t.icon}-bold`" class="themes-icon themes-icon--outline" aria-hidden="true" />
                    <UIcon :name="`i-ph-${t.icon}-fill`" class="themes-icon themes-icon--fill" aria-hidden="true" />
                    {{ t.label }}
                </button>
            </div>

            <section class="preview" aria-label="Wallpaper preview">
                <IPhoneMockup :device="device" :svg="result.svg" :theme="form.theme" :time-zone="form.timeZone" :now="now" />
            </section>

            <section class="form">
                <div class="fields">
                    <label class="field">
                        <span class="field-label">Title</span>
                        <span class="field-box">
                            <input v-model="form.titles[form.theme]" class="field-input" maxlength="48" :placeholder="defaultTitles[form.theme]">
                        </span>
                        <p v-if="titleHasEmoji" class="field-hint" role="status">Emoji aren’t supported: they won’t appear in the preview or on your wallpaper.</p>
                    </label>

                    <div class="field">
                        <span id="style-label" class="field-label">Style</span>
                        <!-- Each name is set in its own font, like Instagram's text styles; the row scrolls sideways on phones. -->
                        <div ref="picker" class="font-picker" :class="{ 'fade-start': fade.start, 'fade-end': fade.end }" role="radiogroup" aria-labelledby="style-label"
                            @keydown="onRadioKeys" @scroll.passive="updateFade">
                            <button v-for="f in TITLE_FONTS" :key="f.id" type="button" role="radio"
                                :aria-checked="form.font === f.id" :tabindex="form.font === f.id ? 0 : -1"
                                class="font-chip" :style="{ fontFamily: `'${f.family}', sans-serif`, fontWeight: f.weight, fontStyle: 'italic' in f ? 'italic' : 'normal' }"
                                @click="form.font = f.id">
                                {{ f.label }}
                            </button>
                        </div>
                    </div>

                    <div class="field">
                        <span id="accent-label" class="field-label">Color</span>
                        <span class="field-box"><ColorField v-model="form.accent" aria-labelledby="accent-label" /></span>
                        <p class="field-hint">Colors the current stone and the counter.</p>
                    </div>

                    <!-- out-in: the old theme's dates leave before the new ones enter, so the form never holds both. -->
                    <Transition name="field-swap" mode="out-in">
                        <div v-if="form.theme === 'birthday'" class="field">
                            <span id="birth-label" class="field-label">Birthday</span>
                            <span class="field-box" :class="{ 'is-invalid': fieldError('birthDate') }"><DateField v-model="form.birthDate" aria-labelledby="birth-label" /></span>
                            <p v-if="fieldError('birthDate')" class="field-hint field-error" role="alert">{{ fieldError('birthDate') }}</p>
                            <p v-else class="field-hint">One stone per year of a 90-year life, the colored one is this year.</p>
                        </div>
                        <div v-else-if="form.theme === 'anniversary'" class="field">
                            <span id="anniversary-label" class="field-label">Together since</span>
                            <span class="field-box" :class="{ 'is-invalid': fieldError('startDate') }"><DateField v-model="form.anniversaryDate" aria-labelledby="anniversary-label" /></span>
                            <p v-if="fieldError('startDate')" class="field-hint field-error" role="alert">{{ fieldError('startDate') }}</p>
                            <p v-else class="field-hint">One stone per anniversary, the colored one is the latest.</p>
                        </div>
                        <div v-else class="field-group">
                            <div class="field">
                                <span id="target-label" class="field-label">Target date</span>
                                <span class="field-box" :class="{ 'is-invalid': fieldError('targetDate') }"><DateField v-model="form.goalTarget" aria-labelledby="target-label" /></span>
                                <p v-if="fieldError('targetDate')" class="field-hint field-error" role="alert">{{ fieldError('targetDate') }}</p>
                            </div>
                            <div class="field">
                                <span id="start-label" class="field-label">Counting from</span>
                                <span class="field-box" :class="{ 'is-invalid': fieldError('startDate') }"><DateField v-model="form.goalStart" aria-labelledby="start-label" /></span>
                                <p v-if="fieldError('startDate')" class="field-hint field-error" role="alert">{{ fieldError('startDate') }}</p>
                                <p v-else class="field-hint">One stone per day, the colored one is the target. Longer goals switch to weeks or months.</p>
                            </div>
                        </div>
                    </Transition>

                    <label class="field">
                        <span class="field-label">iPhone</span>
                        <span class="field-box">
                            <select v-model="form.model" class="field-input">
                                <option v-for="m in models" :key="m.model" :value="m.model">{{ m.model }}</option>
                            </select>
                            <UIcon name="i-lucide-chevrons-up-down" class="field-icon" />
                        </span>
                    </label>
                    <label class="field">
                        <span class="field-label">Time zone</span>
                        <span class="field-box">
                            <select v-model="form.timeZone" class="field-input">
                                <option v-for="z in timeZones" :key="z.zone" :value="z.zone">{{ z.label }}</option>
                            </select>
                            <UIcon name="i-lucide-chevrons-up-down" class="field-icon" />
                        </span>
                        <p class="field-hint">The wallpaper turns over at midnight in this time zone. Nothing is stored: your settings live in the link.</p>
                    </label>
                </div>

                <Transition name="swap">
                    <p v-if="result.error && !result.error.field" class="ios-footnote form-error" role="alert">{{ result.error.message }}</p>
                </Transition>

                <div class="actions">
                    <button type="button" class="ios-button ios-button--filled actions-main" :disabled="!pngPath"
                        @click="guideOpen = true">
                        <UIcon name="i-heroicons-sparkles-20-solid" class="ios-icon" /> Set up your wallpaper
                    </button>
                    <a :href="pngPath" :aria-disabled="!pngPath" download="cairn-wallpaper.png"
                        class="ios-button ios-button--tinted" @click="onDownload">
                        <Transition name="swap" mode="out-in">
                            <span :key="downloaded ? 'done' : 'idle'" class="ios-button-content">
                                <UIcon :name="downloaded ? 'i-lucide-check' : 'i-lucide-arrow-down-to-line'" class="ios-icon" />
                                {{ downloaded ? 'Downloaded' : 'Download PNG' }}
                            </span>
                        </Transition>
                    </a>
                </div>
            </section>
        </div>

        <SetupGuide v-model:open="guideOpen" :url="liveUrl" />

        <footer class="credits">
            <p>Made by <a href="https://andreasalvalaggio.vercel.app/" target="_blank" rel="noopener">Andrea Salvalaggio</a></p>
            <nav class="credits-links" aria-label="Contact">
                <a v-for="link in contacts" :key="link.label" :href="link.href" :aria-label="link.label" :title="link.label"
                    :target="link.href.startsWith('mailto:') ? undefined : '_blank'" rel="noopener">
                    <UIcon :name="link.icon" class="credits-icon" />
                </a>
            </nav>
        </footer>
    </main>
</template>

<style scoped lang="scss">
.editor {
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: minmax(0, max-content);
    justify-content: center;
    gap: $spacer-6;
    max-width: 64rem;
    min-height: 100dvh;
    margin: $spacer-0 auto;
    padding: env(safe-area-inset-top) max(env(safe-area-inset-right), #{$spacer}) $spacer-0 max(env(safe-area-inset-left), #{$spacer});

    @include up($bp-sm) {
        padding-inline: max(env(safe-area-inset-left), #{$spacer-4}) max(env(safe-area-inset-right), #{$spacer-4});
    }

    @include up($bp-md) {
        justify-content: start;
        gap: $spacer-8;
    }
}

.workspace {
    display: grid;
    grid-template-areas: "intro" "themes" "preview" "form";
    grid-template-columns: minmax(0, 32rem);
    gap: $spacer-4;
    align-self: start;

    @include up($bp-md) {
        grid-template-areas: "intro intro" "themes form" "preview form";
        grid-template-rows: auto auto 1fr;
        grid-template-columns: auto minmax(0, 32rem);
        gap: $spacer-5 $spacer-8;
    }
}

.intro {
    grid-area: intro;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacer;
    padding: $spacer $spacer-0;

    @include up($bp-md) {
        margin-bottom: $spacer-4;
    }

    h1 {
        margin: $spacer-0;
        line-height: $line-height-tight;
    }

    .cairn-logo {
        height: 1.25rem;
    }

    p {
        margin: $spacer-0;
        font-size: $font-size-footnote;
        line-height: $line-height-tight;
        text-align: right;
        color: $label-secondary;
    }

    .intro-line {
        display: block;
    }

    &::after {
        content: '';
        position: absolute;
        inset: auto 0 0;
        height: 0.5px;
        background-color: $separator;
        box-shadow: 0 0 0 100vmax $separator;
        clip-path: inset(0 -100vmax);
    }
}

.themes {
    grid-area: themes;

    @include up($bp-md) {
        align-self: end;
    }
}

.themes-icon {
    display: none;
}

@mixin tab-bar {
    .editor {
        padding-bottom: calc(3.75rem + #{$spacer-7} + env(safe-area-inset-bottom));

        &::after {
            content: '';
            position: fixed;
            inset: auto 0 0;
            z-index: 9;
            height: calc(3.75rem + #{$spacer-8} + env(safe-area-inset-bottom));
            pointer-events: none;
            background: linear-gradient(to top, rgba($black, 0.85), rgba($black, 0));
            -webkit-backdrop-filter: blur(12px);
            backdrop-filter: blur(12px);
            mask-image: linear-gradient(to top, #000 50%, transparent);
        }
    }

    .themes {
        position: fixed;
        inset: auto 0 max(env(safe-area-inset-bottom), #{$spacer});
        z-index: 10;
        width: min(32rem, calc(100% - 2 * #{$spacer}));
        margin-inline: auto;
        border-color: rgba($white, 0.14);
        background-color: rgba(18, 18, 20, 0.72);
        box-shadow: 0 8px 32px rgba($black, 0.5), inset 0 1px 0 rgba($white, 0.08);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        backdrop-filter: blur(24px) saturate(180%);

        .ios-segmented-thumb {
            background-color: rgba($white, 0.08);
            box-shadow: none;
        }

        .ios-segmented-item {
            flex-direction: column;
            gap: 2px;
            min-height: 3.75rem;
            padding: $spacer-2;
            font-size: 0.75rem;
            font-weight: $font-weight-medium;
            letter-spacing: 0;
            color: rgba($white, 0.82);

            &[aria-checked="true"] {
                color: $tint;

                .themes-icon--outline {
                    display: none;
                }

                .themes-icon--fill {
                    display: block;
                }
            }
        }

        .themes-icon--outline {
            display: block;
        }

        .themes-icon {
            width: 1.625rem;
            height: 1.625rem;
        }
    }
}

@media (display-mode: standalone) {
    @include down($bp-md) {
        @include tab-bar;

        .workspace {
            grid-template-areas: "intro" "preview" "form";
        }
    }

    @media #{$phone-landscape} and (min-width: $bp-md) {
        @include tab-bar;

        .workspace {
            grid-template-areas: "preview intro" "preview form";
        }
    }
}

.preview {
    grid-area: preview;

    @include down($bp-md) {
        :deep(.phone) {
            --screen: min(300px, 50vw);
        }
    }

    @include up($bp-md) {
        position: sticky;
        top: $spacer-7;
        align-self: start;
    }
}

.form {
    display: flex;
    grid-area: form;
    flex-direction: column;
}

.credits {
    display: flex;
    align-self: end;
    align-items: center;
    justify-content: space-between;
    gap: $spacer;
    padding: $spacer-4 $spacer-0;
    position: relative;
    font-size: $font-size-footnote;
    color: $label-secondary;

    margin-top: $spacer-4;

    @include up($bp-md) {
        margin-top: $spacer-6;
    }
    
    &::before {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        height: 0.5px;
        background-color: $separator;
        box-shadow: 0 0 0 100vmax $separator;
        clip-path: inset(0 -100vmax);
    }

    p {
        margin: $spacer-0;
        white-space: nowrap;
    }

    a {
        color: $label;
        text-decoration: none;
        transition: color 0.2s ease, transform 120ms $ease-out;

        &:focus-visible {
            color: $tint;
        }

        @media (hover: hover) and (pointer: fine) {
            &:hover {
                color: $tint;
            }
        }
    }
}

.credits-links {
    display: flex;
    margin-right: -$spacer-3;

    a {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        margin: -$spacer-3 0;
        border-radius: $radius-pill;

        &:active {
            transform: scale(0.94);
        }
    }
}

.credits-icon {
    width: 1.25rem;
    height: 1.25rem;
}


.fields {
    display: flex;
    flex-direction: column;
    gap: $spacer-4;
}

.font-picker {
    display: flex;
    gap: $spacer-2;
    padding: 4px;
    margin: -4px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scroll-padding-inline: 4px;
    scrollbar-width: none;
    --fade-start: 0px;
    --fade-end: 0px;
    mask-image: linear-gradient(to right, transparent, #000 var(--fade-start), #000 calc(100% - var(--fade-end)), transparent);
    transition: --fade-start 200ms ease, --fade-end 200ms ease;

    &.fade-start {
        --fade-start: 2.5rem;
    }

    &.fade-end {
        --fade-end: 2.5rem;
    }

    &::-webkit-scrollbar {
        display: none;
    }

    @include reduced-motion {
        transition: none;
    }
}

@property --fade-start {
    syntax: '<length>';
    inherits: false;
    initial-value: 0px;
}

@property --fade-end {
    syntax: '<length>';
    inherits: false;
    initial-value: 0px;
}

.font-chip {
    flex-shrink: 0;
    height: $segment-height + 0.25rem;
    padding: $spacer-0 $spacer-3 + 0.125rem;
    font-size: $font-size-subhead;
    color: $label;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid rgba($white, 0.1);
    border-radius: $radius-pill;
    background-color: rgba($white, 0.05);
    scroll-snap-align: start;
    transition: background-color 150ms ease, color 150ms ease, transform 120ms $ease-out;

    &[aria-checked="true"] {
        border-color: $white;
        color: $black;
        background-color: $white;
    }

    &:active {
        transform: scale(0.97);
    }

    &:focus-visible {
        outline: 2px solid $tint;
        outline-offset: 2px;
    }

    @include reduced-motion {
        transition: none;
    }
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: $spacer-4;
}

.field-swap-enter-active {
    transition: opacity 180ms ease, transform 180ms $ease-out;
}

.field-swap-leave-active {
    transition: opacity 120ms ease, transform 120ms $ease-out;
}

.field-swap-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

.field-swap-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

@include reduced-motion {
    .field-swap-enter-from,
    .field-swap-leave-to {
        transform: none;
    }
}

@keyframes enter {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
}

@keyframes enter-fade {
    from {
        opacity: 0;
    }
}

.intro,
.preview,
.form {
    animation: enter 300ms $ease-out backwards;

    @include reduced-motion {
        animation-name: enter-fade;
    }
}

.preview {
    animation-delay: 60ms;
}

.form {
    animation-delay: 120ms;
}

.form-error {
    margin-top: $spacer-4;
    color: $red;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: $spacer-3;
    margin-top: $spacer-5;

    @include up($bp-sm) {
        flex-direction: row;
    }
}

@media #{$phone-landscape} {
    .workspace {
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: $spacer-6;
    }

    .preview :deep(.phone) {
        --screen: 240px;
    }

    .actions {
        flex-direction: column;
    }

    .actions .actions-main {
        flex: none;
    }
}

.actions-main {
    .ios-icon {
        width: 16px;
        height: 16px;
    }

    @include up($bp-sm) {
        flex: 1;
    }
}
</style>
