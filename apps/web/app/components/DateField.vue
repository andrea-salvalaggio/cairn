<script setup lang="ts">
import { type CalendarDate, parseDate } from '@internationalized/date'

/**
 * Typed date segments (fast on desktop) plus a calendar popover.
 * The form keeps plain YYYY-MM-DD strings, so conversion stays here.
 */
const model = defineModel<string>({ required: true })

const value = computed({
  get: () => {
    try {
      return parseDate(model.value)
    }
    catch {
      return undefined
    }
  },
  set: (date: CalendarDate | undefined) => {
    // A half-typed date is undefined: keep the last full one instead of clearing the config.
    if (date) model.value = date.toString()
  },
})

const input = useTemplateRef('input')
// The ui prop sets 17px like the other fields (Nuxt UI puts text-base md:text-sm on the base slot) and drops its padding: .field-box pads.
// No comments in the template: an extra root node would drop the class and scoped styles.
</script>

<template>
  <UInputDate ref="input" v-model="value" locale="it-IT" variant="none" class="date-field" :ui="{ base: 'text-[length:17px] md:text-[length:17px] ps-7 pe-0', leading: 'ps-0' }">
    <template #leading>
      <UPopover :reference="input?.inputsRef[3]?.$el">
        <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Choose from calendar" class="px-0" />
        <template #content>
          <UCalendar v-model="value" locale="it-IT" class="p-2" />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>

<!-- Not scoped: Nuxt UI forwards the class but not the scope attribute. -->
<style lang="scss">
.date-field {
  flex: 1;
  // Fills the .field-box; the box draws border and focus. Unlayered, so it beats Nuxt UI's text-highlighted.
  color: $label;
}
</style>
