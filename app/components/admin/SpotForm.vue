<script setup lang="ts">
import AddressGeocoder from '~/components/admin/AddressGeocoder.vue'
import { useForm } from 'vee-validate'
import { spotFormSchema, type SpotFormInput } from '~~/shared/schemas/spot'
import type { SpotCategorySummary } from '~~/shared/types/category'
import type { SpotListFilterFloor } from '~~/shared/types/spot'

const props = withDefaults(defineProps<{
  floors: SpotListFilterFloor[]
  categories: SpotCategorySummary[]
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
    hoursText: '',
    holidayText: '',
    phone: '',
    lat: null,
    lng: null,
  }),
  isSubmitting: false,
  submitLabel: '保存する',
})

const emit = defineEmits<{
  submit: [input: SpotFormInput]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors, setFieldValue } = useForm<SpotFormInput>({
  initialValues: props.initialValue,
})

const [floorId, floorIdAttrs] = defineField('floorId')
const [name, nameAttrs] = defineField('name')
const [categoryIds] = defineField('categoryIds')
const [importance, importanceAttrs] = defineField('importance')
const [description, descriptionAttrs] = defineField('description')
const [hoursText, hoursTextAttrs] = defineField('hoursText')
const [holidayText, holidayTextAttrs] = defineField('holidayText')
const [phone, phoneAttrs] = defineField('phone')
const [lat, latAttrs] = defineField('lat')
const [lng, lngAttrs] = defineField('lng')

watch(() => props.initialValue, value => resetForm({ values: value }), { deep: true })

const submit = handleSubmit((values) => {
  const result = spotFormSchema.safeParse(values)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    setErrors(Object.fromEntries(
      Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]]),
    ))
    return
  }

  emit('submit', result.data)
})

function useGeocodeResult(result: { lat: number, lng: number }) {
  setFieldValue('lat', result.lat)
  setFieldValue('lng', result.lng)
}
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
        <div class="sm:col-span-2">
          <label for="spot-description" class="text-sm font-semibold text-stone-800">説明文</label>
          <textarea id="spot-description" v-model="description" v-bind="descriptionAttrs" maxlength="2000" rows="6" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="特徴やおすすめポイントを入力" />
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">営業情報</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label for="spot-hours" class="text-sm font-semibold text-stone-800">営業時間</label>
          <textarea id="spot-hours" v-model="hoursText" v-bind="hoursTextAttrs" maxlength="500" rows="3" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：10:00〜18:00" />
        </div>
        <div>
          <label for="spot-holiday" class="text-sm font-semibold text-stone-800">定休日</label>
          <textarea id="spot-holiday" v-model="holidayText" v-bind="holidayTextAttrs" maxlength="500" rows="3" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：毎週水曜日" />
        </div>
        <div>
          <label for="spot-phone" class="text-sm font-semibold text-stone-800">電話番号</label>
          <input id="spot-phone" v-model="phone" v-bind="phoneAttrs" type="tel" maxlength="50" autocomplete="tel" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5" placeholder="例：03-1234-5678">
          <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 pt-8">
      <h2 class="text-lg font-bold text-stone-900">位置</h2>
      <p class="mt-1 text-sm text-stone-600">住所検索または緯度・経度の直接入力で位置を指定します。位置は後から設定できますが、未設定のスポットは公開できません。</p>
      <div class="mt-5">
        <AddressGeocoder @select="useGeocodeResult" />
      </div>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label for="spot-lat" class="text-sm font-semibold text-stone-800">緯度（lat）</label>
          <input id="spot-lat" v-model.number="lat" v-bind="latAttrs" type="number" min="-90" max="90" step="any" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
          <p v-if="errors.lat" class="mt-1 text-sm text-red-600">{{ errors.lat }}</p>
        </div>
        <div>
          <label for="spot-lng" class="text-sm font-semibold text-stone-800">経度（lng）</label>
          <input id="spot-lng" v-model.number="lng" v-bind="lngAttrs" type="number" min="-180" max="180" step="any" class="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5">
          <p v-if="errors.lng" class="mt-1 text-sm text-red-600">{{ errors.lng }}</p>
        </div>
      </div>
    </section>

    <div class="flex justify-end border-t border-stone-200 pt-6">
      <button type="submit" :disabled="isSubmitting || floors.length === 0" class="rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {{ isSubmitting ? '保存中…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
