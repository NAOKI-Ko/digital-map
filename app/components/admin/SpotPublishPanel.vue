<script setup lang="ts">
import { getPinIconPreset, isFacilityPinIcon } from '~~/shared/constants/spot'
import type { AdminSpotDetail, SpotPublishResponse } from '~~/shared/types/spot'
import type { SpotFieldDefinitionItem } from '~~/shared/types/spot-field'
import { getPinColorVariants } from '~~/shared/utils/pin-style'

const props = defineProps<{
  mapId: string
  spotId: string
  spot: AdminSpotDetail
  fields?: SpotFieldDefinitionItem[]
}>()

const emit = defineEmits<{
  updated: [publication: SpotPublishResponse['publication']]
}>()

function fieldLabel(key: string, fallback: string) {
  return props.fields?.find(field => field.semanticKey === key)?.label ?? fallback
}

const isSaving = ref(false)
const isPreviewOpen = ref(false)
const errorMessage = ref('')
const { success } = useToast()
const pinPreset = computed(() => getPinIconPreset(props.spot.pinIconId))
const facility = computed(() => isFacilityPinIcon(props.spot))
const hasCoordinates = computed(() => props.spot.hasPositionedPlacement ?? (props.spot.x !== null && props.spot.y !== null))
const pinStyle = computed(() => {
  const colors = getPinColorVariants(props.spot.pinColor)
  return {
    '--pin-color': colors.base,
    '--pin-color-light': colors.light,
    '--pin-color-dark': colors.dark,
  }
})

async function togglePublication() {
  isSaving.value = true
  errorMessage.value = ''
  const nextState = !props.spot.isPublished

  try {
    const response = await $fetch<SpotPublishResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/publish`, {
      method: 'PATCH',
      body: { isPublished: nextState },
    })
    emit('updated', response.publication)
    success(response.publication.isPublished ? 'スポットを公開対象にしました。次のマップ公開時に反映されます。' : 'スポットを公開対象外にしました。次のマップ公開時に反映されます。', `spot-publication-${props.spotId}`)
  }
  catch {
    errorMessage.value = '公開対象の設定を変更できませんでした。もう一度お試しください。'
  }
  finally {
    isSaving.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') isPreviewOpen.value = false
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-5">
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-lg font-bold text-stone-900">公開対象の設定</h2>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="spot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
            {{ spot.isPublished ? '公開対象' : '公開対象外' }}
          </span>
        </div>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          公開対象にしたスポットは、イラスト上の位置を設定してマップの内容を公開したときに掲載候補になります。ここでの変更だけでは閲覧者の表示は変わりません。
        </p>
        <p v-if="!hasCoordinates" class="mt-2 text-sm font-semibold text-amber-700">イラスト上の位置が未設定のため公開対象にできません。ピン配置で位置を設定してください。</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50" @click="isPreviewOpen = true">
          プレビューを表示
        </button>
        <button type="button" :disabled="isSaving || (!spot.isPublished && !hasCoordinates)" class="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" :class="spot.isPublished ? 'bg-stone-700 hover:bg-stone-800' : 'bg-emerald-700 hover:bg-emerald-800'" @click="togglePublication">
          {{ isSaving ? '変更中…' : spot.isPublished ? '公開対象外にする' : '公開対象にする' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" role="alert" class="mt-5 text-sm text-red-600">{{ errorMessage }}</p>

    <Teleport to="body">
      <div v-if="isPreviewOpen" class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-stone-950/60 p-4" @click.self="isPreviewOpen = false">
        <section role="dialog" aria-modal="true" aria-labelledby="spot-preview-title" class="my-8 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="relative h-52 bg-stone-200">
            <img v-if="spot.photos[0]" :src="spot.photos[0]" :alt="`${spot.name}の代表写真`" class="h-full w-full object-cover">
            <div v-else class="grid h-full place-items-center text-sm text-stone-500">写真は登録されていません</div>
            <div class="absolute bottom-0 left-5 translate-y-1/2">
              <div class="spot-preview-marker" :class="{ 'spot-preview-marker--illustration': spot.pinIconType === 'illustration', 'spot-preview-marker--facility': facility }">
                <span class="spot-preview-shadow" aria-hidden="true" />
                <img v-if="spot.pinIconType === 'illustration' && spot.pinIconImageUrl" :src="spot.pinIconImageUrl" alt="" class="spot-preview-illustration">
                <div v-else class="spot-preview-pin" :class="{ 'spot-preview-pin--with-text': facility && pinPreset.text }" :style="pinStyle">
                  <img v-if="spot.pinIconType === 'custom' && spot.pinIconImageUrl" :src="spot.pinIconImageUrl" alt="" class="spot-preview-pin__content spot-preview-pin__content--custom">
                  <img v-else-if="facility && pinPreset.imageUrl" :src="pinPreset.imageUrl" alt="" aria-hidden="true" class="spot-preview-pin__content spot-preview-pin__content--facility">
                  <span
                    v-else
                    class="spot-preview-pin__content"
                    :class="pinPreset.family === 'material' ? 'material-symbols-outlined spot-preview-pin__content--material' : 'spot-preview-pin__content--kanji'"
                    aria-hidden="true"
                  >{{ pinPreset.symbol }}</span>
                  <span v-if="facility && pinPreset.text" class="spot-preview-pin__facility-text" aria-hidden="true">{{ pinPreset.text }}</span>
                </div>
              </div>
            </div>
            <button type="button" aria-label="プレビューを閉じる" class="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-xl text-stone-700 shadow" @click="isPreviewOpen = false">×</button>
          </div>

          <div class="px-6 pb-6 pt-10">
            <div class="flex flex-wrap items-center gap-2">
              <span v-for="category in spot.categories" :key="category.id" class="rounded-full bg-terracotta-50 px-2.5 py-1 text-xs font-semibold text-terracotta-800">{{ category.name }}</span>
              <span class="text-xs text-stone-500">{{ spot.floorName }}</span>
            </div>
            <h3 id="spot-preview-title" class="mt-3 text-2xl font-bold tracking-tight text-stone-900">{{ spot.name }}</h3>
            <p v-if="spot.description" class="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{{ spot.description }}</p>
            <p v-else class="mt-3 text-sm text-stone-400">説明文は登録されていません。</p>

            <dl class="mt-5 divide-y divide-stone-100 border-y border-stone-100 text-sm">
              <div v-if="spot.hoursText" class="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt class="font-semibold text-stone-700">{{ fieldLabel('hours', '営業時間') }}</dt><dd class="whitespace-pre-line text-stone-600">{{ spot.hoursText }}</dd></div>
              <div v-if="spot.holidayText" class="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt class="font-semibold text-stone-700">{{ fieldLabel('holiday', '定休日') }}</dt><dd class="whitespace-pre-line text-stone-600">{{ spot.holidayText }}</dd></div>
              <div v-if="spot.phone" class="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt class="font-semibold text-stone-700">電話番号</dt><dd><a :href="`tel:${spot.phone}`" class="text-terracotta-700 underline">{{ spot.phone }}</a></dd></div>
            </dl>
            <p class="mt-4 text-center text-xs text-stone-400">管理画面プレビュー</p>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style>
.spot-preview-marker {
  position: relative;
  display: inline-flex;
  width: 3.5rem;
  height: 4.25rem;
  justify-content: center;
}

.spot-preview-marker--illustration {
  width: max-content;
  min-width: 3rem;
  height: 3.75rem;
}

.spot-preview-shadow {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 2rem;
  height: 0.5rem;
  border-radius: 50%;
  background: rgb(37 48 58 / 28%);
  filter: blur(2px);
  transform: translateX(-50%);
}

.spot-preview-pin {
  position: relative;
  z-index: 1;
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border: 3px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background-color: var(--pin-color);
  background-image: radial-gradient(circle at 32% 28%, var(--pin-color-light), var(--pin-color) 55%, var(--pin-color-dark));
  box-shadow:
    0 6px 10px rgb(37 48 58 / 35%),
    inset -3px -3px 6px rgb(0 0 0 / 25%),
    inset 2px 2px 4px rgb(255 255 255 / 35%);
  color: white;
  font-weight: 800;
  transform: rotate(-45deg);
}

.spot-preview-pin > * {
  transform: rotate(45deg);
}

.spot-preview-pin__content {
  display: grid;
  width: 2.625rem;
  height: 2.625rem;
  place-items: center;
  border-radius: 9999px;
  background: white;
  color: #292524;
  line-height: 1;
}

.spot-preview-pin__content--kanji {
  font-size: 1.125rem;
  font-weight: 800;
}

.spot-preview-pin__content--material {
  font-size: 1.375rem;
  font-style: normal;
  font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20;
  font-weight: 400;
}

.spot-preview-pin__content--custom {
  object-fit: cover;
  object-position: center;
}

.spot-preview-marker--facility .spot-preview-pin {
  align-content: center;
  border-color: var(--pin-color);
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 2px 4px rgb(37 48 58 / 22%);
  color: #1c1917;
  transform: none;
}
.spot-preview-marker--facility .spot-preview-pin__content {
  overflow: hidden;
  border-radius: 0;
  background: transparent;
  color: #1c1917;
  transform: none;
  object-fit: contain;
}
.spot-preview-marker--facility .spot-preview-pin--with-text .spot-preview-pin__content {
  height: 2rem;
}
.spot-preview-pin__facility-text {
  color: #1c1917;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1;
  transform: none;
}

.spot-preview-illustration {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  height: 3rem;
  max-width: 10rem;
  object-fit: contain;
  filter: drop-shadow(0 5px 5px rgb(37 48 58 / 32%));
}
</style>
