<script setup lang="ts">
import { useForm } from 'vee-validate'
import { mapNameSchema, type MapNameInput } from '~~/shared/schemas/map'

const props = withDefaults(defineProps<{
  initialName?: string
  isSubmitting?: boolean
  submitLabel?: string
}>(), {
  initialName: '',
  isSubmitting: false,
  submitLabel: '保存する',
})

const emit = defineEmits<{
  submit: [input: MapNameInput]
}>()

const { defineField, errors, handleSubmit, setErrors, setFieldValue } = useForm<MapNameInput>({
  initialValues: { name: props.initialName },
})

const [name, nameAttrs] = defineField('name')

watch(
  () => props.initialName,
  value => setFieldValue('name', value),
)

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
        class="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 outline-none transition focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"
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
        :disabled="isSubmitting"
        class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terracotta-700 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isSubmitting ? '保存中…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
