<script setup lang="ts">
/** Three-step sheet that walks the user through the iOS Shortcut that refreshes the wallpaper daily. */
const props = defineProps<{ url: string }>()
const open = defineModel<boolean>('open', { default: false })

const STEPS = [
  { title: 'Copy your wallpaper link', description: 'This link always returns today’s wallpaper. Your settings live inside it; nothing is stored.' },
  { title: 'Create the Shortcut', description: 'On your iPhone, open Shortcuts, tap +, then add these two actions.' },
  { title: 'Run it every morning', description: 'In Shortcuts, open the Automation tab, tap + and choose Time of Day.' },
]

const step = ref(0)
const direction = ref(1)
const copied = ref(false)
const onIos = /iPhone|iPad|iPod/.test(navigator.userAgent)

watch(open, (value) => {
  if (value) { step.value = 0; copied.value = false }
})

function go(to: number) {
  direction.value = to > step.value ? 1 : -1
  step.value = to
}

async function copy() {
  await navigator.clipboard.writeText(props.url)
  copied.value = true
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="STEPS[step]!.title"
    :description="STEPS[step]!.description"
    :ui="{
      overlay: 'guide-overlay',
      content: 'guide-sheet',
      header: 'guide-header',
      title: 'guide-title',
      description: 'guide-description',
      body: 'guide-body',
      footer: 'guide-footer',
      close: 'guide-close',
    }"
    :close="{ color: 'neutral', variant: 'soft', class: 'guide-close-button' }"
  >
    <template #body>
      <Transition :name="direction > 0 ? 'next' : 'prev'" mode="out-in">
        <!-- 1. Link -->
        <div v-if="step === 0" key="0" class="step">
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
            @click="go(i)"
          />
        </div>
        <div class="nav">
          <button v-if="step > 0" type="button" class="ios-button ios-button--tinted nav-back" @click="go(step - 1)">Back</button>
          <button
            type="button"
            class="ios-button ios-button--filled nav-next"
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
  gap: $spacer;
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
  padding-right: $spacer-5;
  font-size: $font-size-title-2;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $label;
}

.guide-description {
  margin-top: 6px;
  font-size: $font-size-subhead;
  line-height: $line-height-base;
  color: $label-secondary;
}

.guide-body {
  padding: 1.25rem $spacer-4;
}

.guide-footer {
  padding: $spacer-0 $spacer-4 $spacer-4;
}

.guide-close {
  top: 1.25rem;
  right: 1.25rem;
}

.guide-close-button {
  justify-content: center;
  width: 30px;
  height: 30px;
  color: $label-secondary;
  border-radius: $radius-pill;
  background-color: $fill;
}
</style>
