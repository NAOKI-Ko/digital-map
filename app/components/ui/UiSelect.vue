<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

defineOptions({ inheritAttrs: false })

export interface UiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly UiSelectOption[]
  label: string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '選択してください',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [open: boolean]
}>()
</script>

<template>
  <div v-bind="$attrs">
    <SelectRoot
      :model-value="props.modelValue"
      :disabled="disabled"
      @update:model-value="value => emit('update:modelValue', String(value))"
      @update:open="open => emit('update:open', open)"
    >
      <SelectTrigger
        :aria-label="label"
        class="dm-field-focus inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 py-2 text-left text-sm text-stone-900 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
      >
        <SelectValue :placeholder="placeholder" />
        <span aria-hidden="true" class="text-stone-500">⌄</span>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          :collision-padding="12"
          class="z-[70] min-w-[var(--reka-select-trigger-width)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
        >
          <SelectScrollUpButton class="flex h-7 items-center justify-center bg-white text-stone-500">▲</SelectScrollUpButton>
          <SelectViewport class="max-h-[min(18rem,var(--reka-select-content-available-height))] p-1">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm text-stone-800 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-terracotta-50 data-[highlighted]:text-terracotta-900"
            >
              <SelectItemIndicator class="absolute left-3" aria-hidden="true">✓</SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
          <SelectScrollDownButton class="flex h-7 items-center justify-center bg-white text-stone-500">▼</SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>
