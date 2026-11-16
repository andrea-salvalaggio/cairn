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
const compactClock = ref(false)
</script>

<template>
	<main class="editor">
		<section class="preview" aria-label="Wallpaper preview">
			<IPhoneMockup :device="device" :svg="result.svg" :time-zone="form.timeZone" :now="now" :compact-clock="compactClock" />
			<!-- iOS 27 lets each Lock Screen shrink the clock into the top row; preview both to check the wallpaper fits. -->
			<div class="ios-segmented clock-toggle" role="radiogroup" aria-label="Lock Screen clock"
				:style="{ '--i': compactClock ? 1 : 0, '--n': 2 }">
				<span class="ios-segmented-thumb" aria-hidden="true" />
				<button v-for="(label, i) in ['Large clock', 'Compact clock']" :key="label" type="button" role="radio"
					:aria-checked="compactClock === (i === 1)" class="ios-segmented-item" @click="compactClock = i === 1">
					{{ label }}
				</button>
			</div>
			<p class="preview-caption">
				Clock position is approximate
			</p>
		</section>

		<section class="form">
			<header class="form-header">
				<h1>Cairn</h1>
				<p>Your time as a path of stones, on your Lock Screen.</p>
			</header>

			<!-- Segmented control -->
			<div class="ios-segmented" role="radiogroup" aria-label="Wallpaper type"
				:style="{ '--i': themeIndex, '--n': themes.length }">
				<span class="ios-segmented-thumb" aria-hidden="true" />
				<button v-for="t in themes" :key="t.value" type="button" role="radio"
					:aria-checked="form.theme === t.value" class="ios-segmented-item" @click="form.theme = t.value">
					{{ t.label }}
				</button>
			</div>

			<h2 class="section-header">Wallpaper</h2>
			<div class="ios-group">
				<label class="ios-row">
					<span>Title</span>
					<input v-model="form.titles[form.theme]" class="ios-field" maxlength="48" placeholder="Optional">
				</label>
				<div v-if="form.theme === 'birthday'" class="ios-row">
					<span>Birthday</span>
					<DateField v-model="form.birthDate" />
				</div>
				<div v-if="form.theme === 'anniversary'" class="ios-row">
					<span>Together since</span>
					<DateField v-model="form.anniversaryDate" />
				</div>
				<template v-if="form.theme === 'goal'">
					<div class="ios-row">
						<span>Target date</span>
						<DateField v-model="form.goalTarget" />
					</div>
					<div class="ios-row">
						<span>Counting from</span>
						<DateField v-model="form.goalStart" />
					</div>
				</template>
			</div>
			<p class="ios-footnote">
				<template v-if="form.theme === 'birthday'">One stone per year of a 90-year life.</template>
				<template v-else-if="form.theme === 'anniversary'">One stone per week, the heart marks this one, until your next
					anniversary.</template>
				<template v-else>One stone per day. Longer goals switch to weeks or months.</template>
			</p>

			<h2 class="section-header">Device</h2>
			<div class="ios-group">
				<label class="ios-row">
					<span>iPhone</span>
					<select v-model="form.model" class="ios-field">
						<option v-for="m in models" :key="m.model" :value="m.model">{{ m.model }}</option>
					</select>
					<UIcon name="i-lucide-chevrons-up-down" class="ios-chevron" />
				</label>
				<label class="ios-row">
					<span>Time zone</span>
					<select v-model="form.timeZone" class="ios-field">
						<option v-for="z in timeZones" :key="z.zone" :value="z.zone">{{ z.label }}</option>
					</select>
					<UIcon name="i-lucide-chevrons-up-down" class="ios-chevron" />
				</label>
			</div>
			<p class="ios-footnote">The wallpaper turns over at midnight in this time zone. Nothing is stored: your
				settings live in
				the link.</p>

			<p v-if="result.error" class="ios-footnote form-error" role="alert">{{ result.error }}</p>

			<div class="actions">
				<button type="button" class="ios-button ios-button--filled actions-main" :disabled="!pngPath"
					@click="guideOpen = true">
					Set up your wallpaper
				</button>
				<a :href="pngPath" :aria-disabled="!pngPath" download="cairn-wallpaper.png"
					class="ios-button ios-button--tinted">
					<UIcon name="i-lucide-arrow-down-to-line" class="ios-icon" /> Download PNG
				</a>
			</div>
		</section>

		<SetupGuide v-model:open="guideOpen" :url="liveUrl" />
	</main>
</template>

<style scoped lang="scss">
.editor {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: $spacer-6;
	max-width: 64rem;
	min-height: 100dvh;
	margin: $spacer-0 auto;
	padding: 2.5rem $spacer;

	@include up($bp-sm) {
		padding-inline: $spacer-4;
	}

	@include up($bp-md) {
		grid-template-columns: auto minmax(0, 1fr);
		gap: $spacer-8;
		padding-block: $spacer-7;
	}
}

.preview {
	@include up($bp-md) {
		position: sticky;
		top: $spacer-7;
		align-self: start;
	}
}

.clock-toggle {
	max-width: 260px;
	margin: $spacer-4 auto $spacer-0;
}

.preview-caption {
	margin: $spacer-3 $spacer-0 $spacer-0;
	font-size: $font-size-footnote;
	text-align: center;
	color: $gray;
}

.form {
	display: flex;
	flex-direction: column;
	max-width: 32rem;
}

.form-header {
	margin-bottom: $spacer-5;

	h1 {
		margin: $spacer-0;
		font-size: $font-size-large-title;
		font-weight: $font-weight-bold;
		line-height: $line-height-tight;
		letter-spacing: -0.025em;
	}

	p {
		margin: $spacer-1 $spacer-0 $spacer-0;
		color: $label-secondary;
	}
}

.section-header {
	margin: $spacer-5 $spacer $spacer-2;
	font-size: $font-size-footnote;
	font-weight: $font-weight-regular;
	text-transform: uppercase;
	color: $label-secondary;
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

.actions-main {
	@include up($bp-sm) {
		flex: 1;
	}
}
</style>
