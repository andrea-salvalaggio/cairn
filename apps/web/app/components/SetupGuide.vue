<script setup lang="ts">
/** Three-step sheet that walks the user through the iOS Shortcut that refreshes the wallpaper daily. */
const props = defineProps<{ url: string }>()
const open = defineModel<boolean>('open', { default: false })

const STEPS = [
  { title: 'Copy your wallpaper link', lead: 'This link always returns today’s wallpaper. Your settings live inside it, nothing is stored.' },
  // Every step's text sits at the top of the body, so title-to-text spacing is the same on each one.
  // Steps the user follows on the iPhone are a numbered list, not a sentence of commas.
  { title: 'Create the Shortcut', instructions: ['Open Shortcuts on your iPhone', 'Tap +', 'Add these two actions'] },
  { title: 'Run it every morning', instructions: ['In Shortcuts, open the Automation tab', 'Tap +', 'Choose Time of Day and set it like this'] },
]

const step = ref(0)
const direction = ref(1)
const copied = ref(false)
// The other steps need the link, so Continue (and the later dots) wait for the first copy.
const linkCopied = ref(false)
const onIos = /iPhone|iPad|iPod/.test(navigator.userAgent)

let resetCopied: ReturnType<typeof setTimeout> | undefined

watch(open, (value) => {
  if (value) { step.value = 0; copied.value = false; linkCopied.value = false; clearTimeout(resetCopied) }
})
onBeforeUnmount(() => clearTimeout(resetCopied))

function go(to: number) {
  direction.value = to > step.value ? 1 : -1
  step.value = to
}

async function copy(event: MouseEvent) {
  // Read before the await: the browser clears currentTarget once the click has been handled.
  const button = event.currentTarget as HTMLElement
  await navigator.clipboard.writeText(props.url)
  copied.value = true
  linkCopied.value = true
  // Back to "Copy link" on its own, so the link can be copied again.
  clearTimeout(resetCopied)
  resetCopied = setTimeout(() => (copied.value = false), 3000)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) confetti(button)
}

// A click outside (or Esc) can't close the guide: the sheet swells for a moment to say "in here, use the X".
function nudge() {
  const sheet = document.querySelector<HTMLElement>('.guide-sheet')
  if (!sheet || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Soft swell: eases out to the peak, then eases in and out back to rest, so there is no snap at either end.
  sheet.animate(
    [
      { transform: 'scale(1)', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { transform: 'scale(1.025)', offset: 0.4, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      { transform: 'scale(1)' },
    ],
    { duration: 520 },
  )
}

// Little stones (ochre, white, grey) thrown up from the button, then falling away.
const CONFETTI_COLORS = ['#FF9F0A', '#F5F5F7', '#8E8E93']

function confetti(from: HTMLElement) {
  const { left, top, width } = from.getBoundingClientRect()
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('span')
    piece.className = 'guide-confetti'
    piece.setAttribute('aria-hidden', 'true')
    piece.style.left = `${left + width / 2}px`
    piece.style.top = `${top}px`
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!
    document.body.append(piece)
    // A fan pointing up, wider than it is tall.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
    const distance = 70 + Math.random() * 90
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    const spin = (Math.random() - 0.5) * 720
    piece.animate([
      { transform: 'translate(-50%, 0) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx * 1.2}px), ${dy + 70}px) rotate(${spin}deg)`, opacity: 0 },
    ], { duration: 1300 + Math.random() * 500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).finished.then(() => piece.remove())
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    @close:prevent="nudge"
    :title="STEPS[step]!.title"
    :ui="{
      overlay: 'guide-overlay',
      content: 'guide-sheet',
      header: 'guide-header',
      title: 'guide-title',
      body: 'guide-body',
      footer: 'guide-footer',
      close: 'guide-close',
    }"
    :close="{ color: 'neutral', variant: 'soft', class: 'guide-close-button' }"
  >
    <template #title>
      <span class="step-number">{{ step + 1 }}</span>{{ STEPS[step]!.title }}
    </template>

    <template #body>
      <Transition :name="direction > 0 ? 'next' : 'prev'" mode="out-in">
        <!-- 1. Link -->
        <div v-if="step === 0" key="0" class="step">
          <p class="lead">{{ STEPS[0]!.lead }}</p>
          <div class="ios-group ios-group--elevated link">
            <UIcon name="i-lucide-link" class="ios-icon link-icon" />
            <code>{{ url }}</code>
          </div>
          <button type="button" class="ios-button ios-button--tinted" @click="copy">
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="ios-icon" />
            {{ copied ? 'Copied' : 'Copy link' }}
          </button>
        </div>

        <!-- 2. Shortcut: a miniature of the two actions as they look in the Shortcuts app -->
        <div v-else-if="step === 1" key="1" class="step step--tight">
          <ol class="instructions">
            <li v-for="line in STEPS[1]!.instructions" :key="line">{{ line }}</li>
          </ol>
          <div class="action">
            <span class="action-icon action-icon--blue"><UIcon name="i-lucide-globe" class="action-glyph" /></span>
            <p>Get contents of <span class="token">your link</span></p>
          </div>
          <div class="connector" />
          <div class="action">
            <span class="action-icon action-icon--indigo"><UIcon name="i-lucide-image" class="action-glyph" /></span>
            <p>Set <span class="token">Lock Screen</span> wallpaper to <span class="token">Contents of URL</span></p>
          </div>
          <p class="ios-footnote hint">
            Tap the arrow on <em>Set Wallpaper</em> and turn off <strong>Crop to Subject</strong> and <strong>Show Preview</strong>.
          </p>
          <a v-if="onIos" href="shortcuts://create-shortcut" class="ios-button ios-button--tinted">
            <UIcon name="i-lucide-square-arrow-out-up-right" class="ios-icon" /> Open Shortcuts
          </a>
        </div>

        <!-- 3. Automation -->
        <div v-else key="2" class="step">
          <ol class="instructions">
            <li v-for="line in STEPS[2]!.instructions" :key="line">{{ line }}</li>
          </ol>
          <ol class="ios-group ios-group--elevated">
            <li class="ios-row"><span>Time</span><span class="ios-value">6:00 AM</span></li>
            <li class="ios-row"><span>Repeat</span><span class="ios-value">Daily</span></li>
            <li class="ios-row"><span>Run Immediately</span><UIcon name="i-lucide-check" class="ios-icon check" /></li>
            <li class="ios-row"><span>Shortcut</span><span class="ios-value">Your new shortcut</span></li>
          </ol>
          <div class="note">
            <UIcon name="i-lucide-info" class="ios-icon note-icon" />
            <p>
              Your Lock Screen must use a <strong>Photo</strong> wallpaper. Colors, gradients and live wallpapers can’t be replaced by a Shortcut.
            </p>
          </div>
        </div>
      </Transition>
    </template>

    <template #footer>
      <div class="footer">
        <div class="dots" role="tablist" aria-label="Setup progress">
          <button
            v-for="(s, i) in STEPS"
            :key="s.title"
            type="button"
            role="tab"
            :aria-selected="i === step"
            :aria-label="`Step ${i + 1} of ${STEPS.length}: ${s.title}`"
            class="dot"
            :class="{ 'dot--active': i === step }"
            :disabled="i > 0 && !linkCopied"
            @click="go(i)"
          />
        </div>
        <div class="nav">
          <button v-if="step > 0" type="button" class="ios-button ios-button--tinted nav-back" @click="go(step - 1)">Back</button>
          <button
            type="button"
            class="ios-button ios-button--filled nav-next"
            :disabled="step === 0 && !linkCopied"
            @click="step < STEPS.length - 1 ? go(step + 1) : (open = false)"
          >
            {{ step < STEPS.length - 1 ? 'Continue' : 'Done' }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped lang="scss">
.step {
  display: flex;
  flex-direction: column;
  gap: $spacer-3;

  &--tight {
    gap: 10px;
  }
}

.link {
  display: flex;
  align-items: center;
  gap: $spacer-3;
  padding: $spacer-3 $spacer;

  code {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-family: $font-mono;
    font-size: $font-size-footnote;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: $label-secondary;
  }
}

.link-icon,
.check,
.note-icon {
  color: $tint;
}

.action {
  display: flex;
  align-items: center;
  gap: $spacer-3;
  padding: $spacer-3 14px;
  font-size: $font-size-subhead;
  line-height: $line-height-relaxed;
  border-radius: $radius;
  background-color: $elevated;

  p {
    margin: $spacer-0;
  }
}

.action-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  color: $white;
  border-radius: $radius-2;

  &--blue {
    background-color: $blue;
  }

  &--indigo {
    background-color: $indigo;
  }
}

.action-glyph {
  width: 16px;
  height: 16px;
}

// Shortcuts shows parameters as tinted tokens.
.token {
  padding: 1px 6px;
  white-space: nowrap;
  color: $blue-light;
  border-radius: $radius-1;
  background-color: rgba($blue, 0.18);
}

.connector {
  width: 1px;
  height: $spacer-3;
  margin: $spacer-0 auto;
  background-color: $separator;
}

.lead,
.instructions {
  margin: $spacer-0 $spacer-0 $spacer-2;
  font-size: $font-size-subhead;
  line-height: $line-height-base;
  color: $label-secondary;
}

.instructions {
  padding-left: 1.25rem;
  list-style: decimal;

  li::marker {
    font-variant-numeric: tabular-nums;
  }
}

.hint {
  margin: $spacer-2 $spacer-0 $spacer-0;

  strong {
    color: $label;
  }
}

.note {
  display: flex;
  gap: $spacer-3;
  padding: $spacer;
  font-size: $font-size-subhead;
  line-height: $line-height-base;
  border-radius: $radius;
  background-color: rgba($tint, 0.1);

  .note-icon {
    margin-top: 2px;
  }

  p {
    margin: $spacer-0;
    color: $label-secondary;
  }

  strong {
    color: $label;
  }
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.125rem;
  width: 100%;
}

.dots {
  display: flex;
  align-items: center;
  gap: $spacer-2;
}

.dot {
  width: $spacer-2;
  height: $spacer-2;
  padding: $spacer-0;
  cursor: pointer;
  border: 0;
  border-radius: $radius-pill;
  background-color: $label-tertiary;

  &:disabled {
    cursor: not-allowed;
  }
  transition: width 300ms $ease-out, background-color 300ms;

  &--active {
    width: $spacer-4;
    background-color: $tint;
  }

  @include reduced-motion {
    transition: none;
  }
}

.nav {
  display: flex;
  gap: $spacer-3;
  width: 100%;
}

.nav-back {
  flex: 1;
}

.nav-next {
  flex: 2;
}

.next-enter-active,
.next-leave-active,
.prev-enter-active,
.prev-leave-active {
  transition: opacity 180ms ease, transform 220ms $ease-out;

  @include reduced-motion {
    transition: opacity 150ms;
  }
}

.next-enter-from,
.prev-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.next-leave-to,
.prev-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

@include reduced-motion {
  .next-enter-from,
  .next-leave-to,
  .prev-enter-from,
  .prev-leave-to {
    transform: none;
  }
}
</style>

<!-- The sheet is teleported by Nuxt UI, so its frame cannot be scoped. -->
<style lang="scss">
.guide-overlay {
  background-color: rgba($black, 0.6);
  backdrop-filter: blur(4px);
}

.guide-sheet {
  max-width: 28rem;
  border-radius: $radius-4;
  background-color: $grouped;
  box-shadow: 0 24px 48px rgba($black, 0.5);

  > * {
    border: 0;
  }
}

.guide-header {
  flex-direction: column;
  align-items: flex-start;
  gap: $spacer-0;
  min-height: 0;
  padding: $spacer-4 $spacer-4 $spacer-0;
}

.guide-title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  // Room for the 30px close button plus a gap, so a long title wraps instead of touching it.
  padding-right: 2.75rem;
  // Two even lines on narrow screens rather than one word left alone.
  text-wrap: balance;
  font-size: $font-size-title-2;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $label;
}

.step-number {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  // Centred on the title's first line (33px), like the close button.
  margin-top: 3.5px;
  font-size: $font-size-subhead;
  font-weight: $font-weight-bold;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  color: $black;
  border-radius: $radius-pill;
  background-color: $tint;
}

.guide-body {
  // The progress dots get the same air above (here) and below (.footer gap): 18px each side.
  padding: 1.25rem $spacer-4 1.125rem;
}

.guide-footer {
  padding: $spacer-0 $spacer-4 $spacer-4;
}

.guide-close {
  // Centred on the title's first line (33px tall, the button 30px) and on the content's right edge.
  top: calc(#{$spacer-4} + 1.5px);
  right: $spacer-4;
}

.guide-close-button {
  justify-content: center;
  width: 30px;
  height: 30px;
  color: $label-secondary;
  border-radius: $radius-pill;
  background-color: $fill;
  cursor: pointer;
}
</style>

<!-- Not scoped: the confetti pieces live on <body>, outside the component. -->
<style lang="scss">
.guide-confetti {
  position: fixed;
  z-index: 1000;
  width: 8px;
  height: 7px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  pointer-events: none;
}
</style>
