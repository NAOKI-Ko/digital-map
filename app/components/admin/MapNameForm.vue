<script setup lang="ts">
import UnsavedChangesGuard from '~/components/admin/UnsavedChangesGuard.vue'
import { useForm } from 'vee-validate'
import { mapNameSchema, type MapNameInput } from '~~/shared/schemas/map'

const props = withDefaults(defineProps<{
  initialName?: string
  isSubmitting?: boolean
  submitLabel?: string
  guardNavigation?: boolean
}>(), {
  initialName: '',
  isSubmitting: false,
  submitLabel: '保存する',
  guardNavigation: true,
})

const emit = defineEmits<{
  submit: [input: MapNameInput]
  dirtyChange: [dirty: boolean]
}>()

const { defineField, errors, handleSubmit, meta, resetForm, setErrors } = useForm<MapNameInput>({
  initialValues: { name: props.initialName },
})

const [name, nameAttrs] = defineField('name')
watch(() => meta.value.dirty, dirty => emit('dirtyChange', dirty), { immediate: true })
function restoreSaved() { resetForm({ values: { name: props.initialName } }) }

watch(() => props.initialName, value => {
  if (!meta.value.dirty) resetForm({ values: { name: value } })
})
function acceptSaved(name: string) { resetForm({ values: { name } }) }
defineExpose({ restoreSaved, acceptSaved })

const submit = handleSubmit((values) => {
  const result = mapNameSchema.safeParse(values)

  if (!result.success) {
    setErrors({
      name: result.error.flatten().fieldErrors.name?.[0],
    })
    return
  }

  emit('submit', result.data)
})
</script>

<template>
  <form class="space-y-6" @submit="submit">
    <div>
      <label for="map-name" class="text-sm font-semibold text-stone-800">
        マップ名
        <span class="ml-1 text-red-600">必須</span>
      </label>
      <p class="mt-1 text-sm text-stone-500">
        閲覧者にも分かりやすい地域名・施設名を入力してください。
      </p>
      <input
        id="map-name"
        v-model="name"
        v-bind="nameAttrs"
        type="text"
        maxlength="100"
        autocomplete="off"
        class="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 transition"
        :class="{ 'border-red-500': errors.name }"
        placeholder="例：○○温泉街まち歩きマップ"
      >
      <p v-if="errors.name" class="mt-1.5 text-sm text-red-600">
        {{ errors.name }}
      </p>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        :disabled="isSubmitting || !meta.dirty"
        class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terracotta-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isSubmitting ? '保存中…' : submitLabel }}
      </button>
    </div>
  </form>
  <UnsavedChangesGuard v-if="guardNavigation" :dirty="meta.dirty && !isSubmitting" />
</template>
