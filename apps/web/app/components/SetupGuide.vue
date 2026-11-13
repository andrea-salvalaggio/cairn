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
      overlay: 'bg-black/60 backdrop-blur-sm',
      content: 'max-w-md rounded-[20px] bg-[var(--ios-grouped)] ring-0 divide-y-0 shadow-2xl',
      header: 'flex-col items-start gap-0 px-6 pt-6 pb-0',
      title: 'text-[22px] font-bold tracking-tight text-white pr-8',
      description: 'mt-1.5 text-[15px] leading-snug text-[var(--ios-secondary)]',
      body: 'px-6 py-5',
      footer: 'px-6 pb-6 pt-0',
      close: 'top-5 end-5',
    }"
    :close="{ color: 'neutral', variant: 'soft', class: 'rounded-full size-[30px] justify-center bg-[var(--ios-fill)] text-[var(--ios-secondary)]' }"
  >
    <template #body>
      <Transition :name="direction > 0 ? 'next' : 'prev'" mode="out-in">
        <!-- 1. Link -->
        <div v-if="step === 0" key="0" class="flex flex-col gap-3">
          <div class="ios-group flex items-center gap-3 bg-[var(--ios-elevated)] px-4 py-3">
            <UIcon name="i-lucide-link" class="size-5 shrink-0 text-[var(--ios-tint)]" />
            <code class="min-w-0 flex-1 truncate text-[13px] text-[var(--ios-secondary)]">{{ url }}</code>
          </div>
          <button type="button" class="ios-button ios-button--tinted w-full" @click="copy">
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-5" />
            {{ copied ? 'Copied' : 'Copy link' }}
          </button>
        </div>

        <!-- 2. Shortcut: a miniature of the two actions as they look in the Shortcuts app -->
        <div v-else-if="step === 1" key="1" class="flex flex-col gap-2.5">
          <div class="action">
            <span class="action-icon bg-[#0a84ff]"><UIcon name="i-lucide-globe" class="size-4" /></span>
            <p>Get contents of <span class="token">your link</span></p>
          </div>
          <div class="mx-auto h-3 w-px bg-[var(--ios-separator)]" />
          <div class="action">
            <span class="action-icon bg-[#5e5ce6]"><UIcon name="i-lucide-image" class="size-4" /></span>
            <p>Set <span class="token">Lock Screen</span> wallpaper to <span class="token">Contents of URL</span></p>
          </div>
          <p class="ios-footnote mx-0 mt-2">
            Tap the arrow on <em>Set Wallpaper</em> and turn off <strong class="text-white">Crop to Subject</strong> and <strong class="text-white">Show Preview</strong>.
          </p>
          <a v-if="onIos" href="shortcuts://create-shortcut" class="ios-button ios-button--tinted mt-2 w-full">
            <UIcon name="i-lucide-square-arrow-out-up-right" class="size-5" /> Open Shortcuts
          </a>
        </div>

        <!-- 3. Automation -->
        <div v-else key="2" class="flex flex-col gap-4">
          <ol class="ios-group bg-[var(--ios-elevated)]">
            <li class="ios-row"><span>Time</span><span class="text-[var(--ios-secondary)]">6:00 AM</span></li>
            <li class="ios-row"><span>Repeat</span><span class="text-[var(--ios-secondary)]">Daily</span></li>
            <li class="ios-row"><span>Run Immediately</span><UIcon name="i-lucide-check" class="size-5 text-[var(--ios-tint)]" /></li>
            <li class="ios-row"><span>Shortcut</span><span class="text-[var(--ios-secondary)]">Your new shortcut</span></li>
          </ol>
          <div class="flex gap-3 rounded-xl bg-[rgb(255_159_10/0.1)] p-4 text-[15px] leading-snug">
            <UIcon name="i-lucide-info" class="mt-0.5 size-5 shrink-0 text-[var(--ios-tint)]" />
            <p class="text-[var(--ios-secondary)]">
              Your Lock Screen must use a <strong class="text-white">Photo</strong> wallpaper. Colors, gradients and live wallpapers can’t be replaced by a Shortcut.
            </p>
          </div>
        </div>
      </Transition>
    </template>

    <template #footer>
      <div class="flex w-full flex-col items-center gap-4">
        <div class="flex items-center gap-2" role="tablist" aria-label="Setup progress">
          <button
            v-for="(s, i) in STEPS"
            :key="s.title"
            type="button"
            role="tab"
            :aria-selected="i === step"
            :aria-label="`Step ${i + 1} of ${STEPS.length}: ${s.title}`"
            class="h-2 rounded-full transition-all duration-300"
            :class="i === step ? 'w-6 bg-[var(--ios-tint)]' : 'w-2 bg-[var(--ios-tertiary)]'"
            @click="go(i)"
          />
        </div>
        <div class="flex w-full gap-3">
          <button v-if="step > 0" type="button" class="ios-button ios-button--tinted flex-1" @click="go(step - 1)">Back</button>
          <button
            type="button"
            class="ios-button ios-button--filled flex-[2]"
            @click="step < STEPS.length - 1 ? go(step + 1) : (open = false)"
          >
            {{ step < STEPS.length - 1 ? 'Continue' : 'Done' }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.action {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  background: var(--ios-elevated);
  padding: 12px 14px;
  font-size: 15px;
  line-height: 1.5;
}

.action-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 7px;
  color: #fff;
}

/* Shortcuts shows parameters as tinted tokens. */
.token {
  border-radius: 6px;
  background: rgb(10 132 255 / 0.18);
  padding: 1px 6px;
  color: #64b5ff;
  white-space: nowrap;
}

.next-enter-active, .next-leave-active, .prev-enter-active, .prev-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.next-enter-from, .prev-leave-to { opacity: 0; transform: translateX(16px); }
.next-leave-to, .prev-enter-from { opacity: 0; transform: translateX(-16px); }

@media (prefers-reduced-motion: reduce) {
  .next-enter-active, .next-leave-active, .prev-enter-active, .prev-leave-active { transition: opacity 150ms; }
  .next-enter-from, .next-leave-to, .prev-enter-from, .prev-leave-to { transform: none; }
}
</style>
