<script setup lang="ts">
import { useForm } from 'vee-validate'
import { spotFormSchema, type SpotFormInput } from '~~/shared/schemas/spot'
import type { SpotCategorySummary } from '~~/shared/types/category'
import type { SpotListFilterFloor } from '~~/shared/types/spot'
import type { SpotFieldDefinitionItem } from '~~/shared/types/spot-field'

const props = withDefaults(defineProps<{
  floors: SpotListFilterFloor[]
  categories: SpotCategorySummary[]
  fields?: SpotFieldDefinitionItem[]
  initialValue?: SpotFormInput
  isSubmitting?: boolean
  submitLabel?: string
}>(), {
  initialValue: () => ({
    floorId: '',
    name: '',
    categoryIds: [],
    importance: 'normal',
    description: '',
    address: '',
    website: '',
    hoursText: '',
    holidayText: '',
    phone: '',
    customValues: {},
    x: null,
    y: null,
  }),
  fields: () => [],
  isSubmitting: false,
  submitLabel: '保存する',
})

const emit = defineEmits<{
  submit: [input: SpotFormInput]
}>()

const { defineField, errors, handleSubmit, meta, resetForm, setErrors } = useForm<SpotFormInput>({
  initialValues: props.initialValue,
})

const [floorId, floorIdAttrs] = defineField('floorId')
const [name, nameAttrs] = defineField('name')
const [categoryIds] = defineField('categoryIds')
const [importance, importanceAttrs] = defineField('importance')
const [description, descriptionAttrs] = defineField('description')
const [address, addressAttrs] = defineField('address')
const [website, websiteAttrs] = defineField('website')
const [hoursText, hoursTextAttrs] = defineField('hoursText')
const [holidayText, holidayTextAttrs] = defineField('holidayText')
const [phone, phoneAttrs] = defineField('phone')
const [customValues] = defineField('customValues')
const enabledFields = computed(() => props.fields.filter(field => field.enabled).toSorted((a, b) => a.order - b.order))
const descriptionField = computed(() => enabledFields.value.find(field => field.semanticKey === 'description'))
const informationFields = computed(() => enabledFields.value.filter(field => field.semanticKey !== 'description'))

function customTextValue(fieldId: string) {
  const value = customValues.value[fieldId]
  return value === null || value === undefined ? '' : String(value)
}

function updateCustomText(fieldId: string, type: SpotFieldDefinitionItem['type'], event: Event) {
  const rawValue = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  customValues.value[fieldId] = type === 'number' && rawValue !== '' ? Number(rawValue) : rawValue
}

function updateCustomBoolean(fieldId: string, event: Event) {
  customValues.value[fieldId] = (event.target as HTMLInputElement).checked
}

watch(() => props.initialValue, value => resetForm({ values: value }), { deep: true })

const submit = handleSubmit((values) => {
  const enabledCustomIds = new Set(enabledFields.value.filter(field => field.kind === 'custom').map(field => field.id))
  const submittedValues = {
    ...values,
    customValues: Object.fromEntries(Object.entries(values.customValues).filter(([fieldId]) => enabledCustomIds.has(fieldId))),
  }
  const result = spotFormSchema.safeParse(submittedValues)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    setErrors(Object.fromEntries(
      Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]]),
    ))
    return
  }

  emit('submit', result.data)
})

</script>

<template>
  <form class="space-y-8" @submit="submit">
    <section>
      <h2 class="text-lg font-bold text-stone-900">基本情報</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label for="spot-floor" class="text-sm font-semibold text-stone-800">フロア <span class="text-red-600">必須</span></label>
          <select id="spot-floor" v-model="floorId" v-bind="floorIdAttrs" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
            <option value="">選択してください</option>
            <option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option>
          </select>
          <p v-if="errors.floorId" class="mt-1 text-sm text-red-600">{{ errors.floorId }}</p>
        </div>
        <div>
          <span class="text-sm font-semibold text-stone-800">カテゴリー</span>
          <div v-if="categories.length" class="mt-2 flex flex-wrap gap-2">
            <label v-for="category in categories" :key="category.id" class="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm">
              <input v-model="categoryIds" type="checkbox" :value="category.id" class="size-4 rounded border-stone-300 text-terracotta-600">
              <CategoryIcon :icon-type="category.iconType" :icon-preset-id="category.iconPresetId" :icon-image-url="category.iconImageUrl" size="sm" />
              <span>{{ category.name }}</span>
            </label>
          </div>
          <p v-else class="mt-2 text-sm text-amber-700">カテゴリーはまだありません。マップ設定のカテゴリー管理から追加できます。</p>
        </div>
        <div>
          <label for="spot-importance" class="text-sm font-semibold text-stone-800">地図上の重要度</label>
          <select id="spot-importance" v-model="importance" v-bind="importanceAttrs" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
            <option value="normal">通常</option>
            <option value="featured">注目（縮小時も優先表示）</option>
          </select>
          <p class="mt-1 text-xs text-stone-500">PINの種類や画像とは独立した表示優先度です。</p>
        </div>
        <div class="sm:col-span-2">
          <label for="spot-name" class="text-sm font-semibold text-stone-800">店名・スポット名 <span class="text-red-600">必須</span></label>
          <input id="spot-name" v-model="name" v-bind="nameAttrs" maxlength="100" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：まちかどカフェ">
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>
        <div v-if="descriptionField" class="sm:col-span-2">
          <label for="spot-description" class="text-sm font-semibold text-stone-800">{{ descriptionField.label }} <span v-if="descriptionField.required" class="text-red-600">必須</span></label>
          <textarea id="spot-description" v-model="description" v-bind="descriptionAttrs" maxlength="2000" rows="6" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="特徴やおすすめポイントを入力" />
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">Media</h2>
      <p class="mt-2 text-sm text-stone-600">写真はSpot作成後、専用のMedia欄で複数追加・並び替えできます。最初の画像が代表画像です。</p>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">Spot情報</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div v-for="field in informationFields" :key="field.id" :class="{ 'sm:col-span-2': field.type === 'multiline_text' }">
          <label :for="`spot-field-${field.id}`" class="text-sm font-semibold text-stone-800">{{ field.label }} <span v-if="field.required" class="text-red-600">必須</span></label>
          <textarea v-if="field.semanticKey === 'hours'" :id="`spot-field-${field.id}`" v-model="hoursText" v-bind="hoursTextAttrs" rows="3" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" />
          <textarea v-else-if="field.semanticKey === 'holiday'" :id="`spot-field-${field.id}`" v-model="holidayText" v-bind="holidayTextAttrs" rows="3" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" />
          <input v-else-if="field.semanticKey === 'phone'" :id="`spot-field-${field.id}`" v-model="phone" v-bind="phoneAttrs" type="tel" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
          <input v-else-if="field.semanticKey === 'address'" :id="`spot-field-${field.id}`" v-model="address" v-bind="addressAttrs" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
          <input v-else-if="field.semanticKey === 'website'" :id="`spot-field-${field.id}`" v-model="website" v-bind="websiteAttrs" type="url" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
          <label v-else-if="field.type === 'boolean'" class="mt-2 flex items-center gap-2"><input :checked="customValues[field.id] === true" type="checkbox" @change="updateCustomBoolean(field.id, $event)"> はい</label>
          <textarea v-else-if="field.type === 'multiline_text'" :id="`spot-field-${field.id}`" :value="customTextValue(field.id)" rows="3" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" @input="updateCustomText(field.id, field.type, $event)" />
          <input v-else :id="`spot-field-${field.id}`" :value="customTextValue(field.id)" :type="field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" @input="updateCustomText(field.id, field.type, $event)">
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">Category / PIN・地図表示</h2>
      <p class="mt-2 text-sm text-stone-600">Categoryと重要度はSpot情報項目とは独立して管理されます。</p>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">公開</h2>
      <p class="mt-2 text-sm text-stone-600">公開状態は保存後の公開設定から変更します。</p>
    </section>

    <div class="flex justify-end border-t border-stone-200 pt-6">
      <button type="submit" :disabled="isSubmitting || floors.length === 0" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {{ isSubmitting ? '保存中…' : submitLabel }}
      </button>
    </div>
  </form>
  <UnsavedChangesGuard :dirty="meta.dirty && !isSubmitting" />
</template>
