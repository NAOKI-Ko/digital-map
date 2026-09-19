<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  forId?: string
  hint?: string
  error?: string
  required?: boolean
}>(), { forId: '', hint: '', error: '', required: false })
</script>

<template>
  <div>
    <label v-if="forId" :for="forId" class="text-sm font-semibold text-stone-800">
      {{ label }} <span v-if="required" class="text-red-700">必須</span>
    </label>
    <p v-else class="text-sm font-semibold text-stone-800">{{ label }} <span v-if="required" class="text-red-700">必須</span></p>
    <div class="mt-2"><slot /></div>
    <p v-if="error" role="alert" class="mt-1.5 text-sm text-red-700">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs leading-5 text-stone-500">{{ hint }}</p>
  </div>
</template>
