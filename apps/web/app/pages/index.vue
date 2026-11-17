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

// Icons are the wallpaper's own markers (Font Awesome 6 solid, same paths as packages/core render.ts).
const themes: { label: string, value: ThemeId, icon: string }[] = [
	{ label: 'Birthday', value: 'birthday', icon: 'i-fa6-solid-gift' },
	{ label: 'Anniversary', value: 'anniversary', icon: 'i-fa6-solid-heart' },
	{ label: 'Goal', value: 'goal', icon: 'i-fa6-solid-star' },
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

const contacts = [
	{ label: 'Email', icon: 'i-fa7-solid-envelope', href: 'mailto:andrea.salvalaggio95@gmail.com' },
	{ label: 'LinkedIn', icon: 'i-fa7-brands-linkedin-in', href: 'https://linkedin.com/in/andrea-salvalaggio' },
	{ label: 'GitHub', icon: 'i-fa7-brands-github', href: 'https://github.com/andrea-salvalaggio' },
]
const compactClock = ref(false)
</script>

<template>
	<main class="editor">
		<div class="workspace">
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
			<div class="ios-segmented ios-segmented--pill" role="radiogroup" aria-label="Wallpaper type"
				:style="{ '--i': themeIndex, '--n': themes.length }">
				<span class="ios-segmented-thumb" aria-hidden="true" />
				<button v-for="t in themes" :key="t.value" type="button" role="radio"
					:aria-checked="form.theme === t.value" class="ios-segmented-item" @click="form.theme = t.value">
					<UIcon :name="t.icon" class="ios-segmented-icon" />{{ t.label }}
				</button>
			</div>

			<div class="fields">
				<label class="field">
					<span class="field-label">Title</span>
					<span class="field-box">
						<input v-model="form.titles[form.theme]" class="field-input" maxlength="48" placeholder="Optional">
					</span>
				</label>

				<div v-if="form.theme === 'birthday'" class="field">
					<span class="field-label">Birthday</span>
					<span class="field-box"><DateField v-model="form.birthDate" /></span>
					<p class="field-hint">One stone per year of a 90-year life.</p>
				</div>
				<div v-if="form.theme === 'anniversary'" class="field">
					<span class="field-label">Together since</span>
					<span class="field-box"><DateField v-model="form.anniversaryDate" /></span>
					<p class="field-hint">One stone per week, the heart marks this one, until your next anniversary.</p>
				</div>
				<template v-if="form.theme === 'goal'">
					<div class="field">
						<span class="field-label">Target date</span>
						<span class="field-box"><DateField v-model="form.goalTarget" /></span>
					</div>
					<div class="field">
						<span class="field-label">Counting from</span>
						<span class="field-box"><DateField v-model="form.goalStart" /></span>
						<p class="field-hint">One stone per day. Longer goals switch to weeks or months.</p>
					</div>
				</template>

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
// Columns are sized to their content (form capped at 32rem), so the credits row spans exactly mockup + form.
// The 1fr row takes the free height and keeps the credits at the bottom of the window.
// One column as wide as the workspace (mockup + form), so the credits below match it exactly.
// The workspace is its own box: the sticky mockup stops at its end and never rides over the credits.
.editor {
	display: grid;
	grid-template-rows: 1fr auto;
	grid-template-columns: minmax(0, max-content);
	justify-content: center;
	gap: $spacer-6;
	max-width: 64rem;
	min-height: 100dvh;
	margin: $spacer-0 auto;
	padding: 2.5rem $spacer $spacer-0;

	@include up($bp-sm) {
		padding-inline: $spacer-4;
	}

	@include up($bp-md) {
		justify-content: start;
		gap: $spacer-8;
		padding-top: $spacer-7;
	}
}

.workspace {
	display: grid;
	grid-template-columns: minmax(0, 32rem);
	gap: $spacer-6;
	align-self: start;

	@include up($bp-md) {
		grid-template-columns: auto minmax(0, 32rem);
		gap: $spacer-8;
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
	color: $gray;

	// Extra air above the credits, on top of the grid gap: a little on mobile, more on desktop.
	margin-top: $spacer-4;

	@include up($bp-md) {
		margin-top: $spacer-6;
	}

	// Edge-to-edge separator: a shadow spread sideways and clipped to the line's height. Shadows never add scroll width.
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
		color: $label-secondary;
		text-decoration: none;
		transition: color 0.2s ease;

		&:hover,
		&:focus-visible {
			color: $tint;
		}
	}
}

.credits-links {
	display: flex;
	// Pull the 44pt tap targets out so the last icon lines up with the separator's edge.
	margin-right: -$spacer-3;

	a {
		display: grid;
		place-items: center;
		width: $row-height;
		height: $row-height;
		margin: -$spacer-3 0;
		border-radius: $radius-pill;
	}
}

.credits-icon {
	width: 1.25rem;
	height: 1.25rem;
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

.fields {
	display: flex;
	flex-direction: column;
	gap: $spacer-4;
	margin-top: $spacer-5;
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
