<script setup lang="ts">
import {
  type Config,
  ConfigError,
  DEFAULT_DEVICE,
  type ThemeId,
  deviceModels,
  encodeConfig,
  getDevice,
  parseConfig,
  render,
  todayInTimeZone,
} from '@cairn/core'

// Milestone 0 editor: enough to exercise the core end to end.
// The full form (colors, symbols, layout, events) arrives in milestone 2.

// Live clock: the mockup ticks and the wallpaper rolls over at midnight in the chosen time zone.
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 1000)
onBeforeUnmount(() => clearInterval(timer))

const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const offsetOf = (timeZone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(now.value).find(p => p.type === 'timeZoneName')?.value ?? ''
const timeZones = [...new Set([detectedZone, ...Intl.supportedValuesOf('timeZone')])]
  .map(zone => ({ zone, label: `${zone.replaceAll('_', ' ')} · ${offsetOf(zone)}` }))

const themes: { label: string, value: ThemeId }[] = [
  { label: 'Birthday', value: 'birthday' },
  { label: 'Anniversary', value: 'anniversary' },
  { label: 'Goal', value: 'goal' },
]
const models = deviceModels()

const initialToday = todayInTimeZone(detectedZone)
const plusDays = (days: number) => todayInTimeZone('UTC', new Date(Date.parse(`${initialToday}T12:00:00Z`) + days * 86_400_000))

const form = reactive({
  theme: 'birthday' as ThemeId,
  model: models.find(m => m.deviceId === DEFAULT_DEVICE)!.model,
  timeZone: detectedZone,
  titles: { birthday: 'My life in years', anniversary: 'Together', goal: 'My goal' } as Record<ThemeId, string>,
  birthDate: '1995-01-01',
  anniversaryDate: plusDays(-365 * 3 - 120),
  goalStart: initialToday,
  goalTarget: plusDays(88),
})

const today = computed(() => todayInTimeZone(form.timeZone, now.value))
const themeIndex = computed(() => themes.findIndex(t => t.value === form.theme))

const result = computed<{ config?: Config, svg?: string, error?: string }>(() => {
  try {
    const config = parseConfig({
      v: 1,
      theme: form.theme,
      device: models.find(m => m.model === form.model)?.deviceId,
      timeZone: form.timeZone,
      title: form.titles[form.theme],
      birthDate: form.theme === 'birthday' ? form.birthDate : undefined,
      startDate: form.theme === 'anniversary' ? form.anniversaryDate : form.theme === 'goal' ? form.goalStart : undefined,
      targetDate: form.theme === 'goal' ? form.goalTarget : undefined,
    })
    return { config, svg: render(config, today.value) }
  }
  catch (error) {
    if (error instanceof ConfigError) return { error: error.message }
    throw error
  }
})

const device = computed(() => getDevice(result.value.config?.device ?? DEFAULT_DEVICE))
const pngPath = computed(() => (result.value.config ? `/w/${encodeConfig(result.value.config)}.png` : undefined))
const liveUrl = computed(() => (pngPath.value ? new URL(pngPath.value, window.location.origin).toString() : ''))
const guideOpen = ref(false)
</script>

<template>
  <main class="mx-auto grid min-h-dvh max-w-5xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-10 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-20 md:py-16">
    <section class="md:sticky md:top-16 md:self-start" aria-label="Wallpaper preview">
      <IPhoneMockup :device="device" :svg="result.svg" :time-zone="form.timeZone" :now="now" />
      <p class="mt-5 text-center text-[13px] text-[var(--ios-tertiary)]">
        {{ device.width }} × {{ device.height }} px · Clock position is approximate
      </p>
    </section>

    <section class="flex max-w-lg flex-col">
      <header class="mb-8">
        <h1 class="text-[34px] leading-tight font-bold tracking-tight">Cairn</h1>
        <p class="mt-1 text-[17px] text-[var(--ios-secondary)]">Your time as a grid of dots, on your Lock Screen.</p>
      </header>

      <!-- Segmented control -->
      <div class="segmented" role="radiogroup" aria-label="Wallpaper type" :style="{ '--i': themeIndex, '--n': themes.length }">
        <span class="segmented-thumb" aria-hidden="true" />
        <button
          v-for="t in themes"
          :key="t.value"
          type="button"
          role="radio"
          :aria-checked="form.theme === t.value"
          class="segmented-item"
          @click="form.theme = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <h2 class="section-header">Wallpaper</h2>
      <div class="ios-group">
        <label class="ios-row">
          <span>Title</span>
          <input v-model="form.titles[form.theme]" class="ios-field" maxlength="48" placeholder="Optional">
        </label>
        <label v-if="form.theme === 'birthday'" class="ios-row">
          <span>Birthday</span>
          <input v-model="form.birthDate" type="date" class="ios-field">
        </label>
        <label v-if="form.theme === 'anniversary'" class="ios-row">
          <span>Together since</span>
          <input v-model="form.anniversaryDate" type="date" class="ios-field">
        </label>
        <template v-if="form.theme === 'goal'">
          <label class="ios-row">
            <span>Target date</span>
            <input v-model="form.goalTarget" type="date" class="ios-field">
          </label>
          <label class="ios-row">
            <span>Counting from</span>
            <input v-model="form.goalStart" type="date" class="ios-field">
          </label>
        </template>
      </div>
      <p class="ios-footnote">
        <template v-if="form.theme === 'birthday'">One dot per year of a 90-year life.</template>
        <template v-else-if="form.theme === 'anniversary'">One heart per week until your next anniversary.</template>
        <template v-else>One dot per day. Longer goals switch to weeks or months.</template>
      </p>

      <h2 class="section-header">Device</h2>
      <div class="ios-group">
        <label class="ios-row">
          <span>iPhone</span>
          <select v-model="form.model" class="ios-field">
            <option v-for="m in models" :key="m.model" :value="m.model">{{ m.model }}</option>
          </select>
          <UIcon name="i-lucide-chevrons-up-down" class="-ml-2 size-4 shrink-0 text-[var(--ios-tertiary)]" />
        </label>
        <label class="ios-row">
          <span>Time zone</span>
          <select v-model="form.timeZone" class="ios-field">
            <option v-for="z in timeZones" :key="z.zone" :value="z.zone">{{ z.label }}</option>
          </select>
          <UIcon name="i-lucide-chevrons-up-down" class="-ml-2 size-4 shrink-0 text-[var(--ios-tertiary)]" />
        </label>
      </div>
      <p class="ios-footnote">The wallpaper turns over at midnight in this time zone. Nothing is stored: your settings live in the link.</p>

      <p v-if="result.error" class="ios-footnote mt-6 text-[var(--ios-red)]" role="alert">{{ result.error }}</p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" class="ios-button ios-button--filled sm:flex-1" :disabled="!pngPath" @click="guideOpen = true">
          Set up your wallpaper
        </button>
        <a
          :href="pngPath"
          :aria-disabled="!pngPath"
          download="cairn-wallpaper.png"
          class="ios-button ios-button--tinted"
        >
          <UIcon name="i-lucide-arrow-down-to-line" class="size-5" /> Download PNG
        </a>
      </div>
    </section>

    <SetupGuide v-model:open="guideOpen" :url="liveUrl" />
  </main>
</template>

<style scoped>
.section-header {
  margin: 32px 16px 8px;
  color: var(--ios-secondary);
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0;
}

/* iOS segmented control: one thumb that slides between equal segments. */
.segmented {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--n), 1fr);
  border-radius: 9px;
  background: var(--ios-fill);
  padding: 2px;
}

.segmented-thumb {
  position: absolute;
  inset: 2px auto 2px 2px;
  width: calc((100% - 4px) / var(--n));
  border-radius: 7px;
  background: #636366;
  box-shadow: 0 3px 8px rgb(0 0 0 / 0.12), 0 3px 1px rgb(0 0 0 / 0.04);
  transform: translateX(calc(var(--i) * 100%));
  transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.segmented-item {
  position: relative;
  height: 32px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.segmented-item:focus-visible {
  outline: 2px solid var(--ios-tint);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-thumb { transition: none; }
}
</style>
