<script setup lang="ts">
import { getPinIconPreset } from '~~/shared/constants/spot'
import type { AdminSpotDetail, SpotPublishResponse } from '~~/shared/types/spot'

const props = defineProps<{
  mapId: string
  spotId: string
  spot: AdminSpotDetail
}>()

const emit = defineEmits<{
  updated: [publication: SpotPublishResponse['publication']]
}>()

const isSaving = ref(false)
const isPreviewOpen = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const pinPreset = computed(() => getPinIconPreset(props.spot.pinIconId))

async function togglePublication() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  const nextState = !props.spot.isPublished

  try {
    const response = await $fetch<SpotPublishResponse>(`/api/maps/${props.mapId}/spots/${props.spotId}/publish`, {
      method: 'PATCH',
      body: { isPublished: nextState },
    })
    emit('updated', response.publication)
    successMessage.value = response.publication.isPublished
      ? 'スポットを公開対象にしました。'
      : 'スポットを下書きに戻しました。'
  }
  catch {
    errorMessage.value = '公開状態を変更できませんでした。もう一度お試しください。'
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
          <h2 class="text-lg font-bold text-stone-900">公開状態</h2>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="spot.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
            {{ spot.isPublished ? '公開' : '下書き' }}
          </span>
        </div>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          公開にすると、マップ全体の公開後に閲覧者へ表示される対象になります。下書きのスポットは公開側には表示されません。
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50" @click="isPreviewOpen = true">
          プレビューを表示
        </button>
        <button type="button" :disabled="isSaving" class="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" :class="spot.isPublished ? 'bg-stone-700 hover:bg-stone-800' : 'bg-emerald-700 hover:bg-emerald-800'" @click="togglePublication">
          {{ isSaving ? '変更中…' : spot.isPublished ? '下書きに戻す' : 'スポットを公開する' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" role="alert" class="mt-5 text-sm text-red-600">{{ errorMessage }}</p>
    <p v-if="successMessage" role="status" class="mt-5 text-sm text-emerald-700">{{ successMessage }}</p>

    <Teleport to="body">
      <div v-if="isPreviewOpen" class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-stone-950/60 p-4" @click.self="isPreviewOpen = false">
        <section role="dialog" aria-modal="true" aria-labelledby="spot-preview-title" class="my-8 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="relative h-52 bg-stone-200">
            <img v-if="spot.photos[0]" :src="spot.photos[0]" :alt="`${spot.name}の代表写真`" class="h-full w-full object-cover">
            <div v-else class="grid h-full place-items-center text-sm text-stone-500">写真は登録されていません</div>
            <div class="absolute bottom-0 left-5 translate-y-1/2">
              <div class="spot-preview-pin" :style="{ '--pin-color': spot.pinColor }">
                <img v-if="spot.pinIconType === 'custom' && spot.pinIconImageUrl" :src="spot.pinIconImageUrl" alt="" class="h-7 w-7 rounded-full bg-white object-cover">
                <span v-else>{{ pinPreset.symbol }}</span>
              </div>
            </div>
            <button type="button" aria-label="プレビューを閉じる" class="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-xl text-stone-700 shadow" @click="isPreviewOpen = false">×</button>
          </div>

          <div class="px-6 pb-6 pt-10">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-terracotta-50 px-2.5 py-1 text-xs font-semibold text-terracotta-800">{{ spot.category }}</span>
              <span class="text-xs text-stone-500">{{ spot.floorName }}</span>
            </div>
            <h3 id="spot-preview-title" class="mt-3 text-2xl font-bold tracking-tight text-stone-900">{{ spot.name }}</h3>
            <p v-if="spot.description" class="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{{ spot.description }}</p>
            <p v-else class="mt-3 text-sm text-stone-400">説明文は登録されていません。</p>

            <dl class="mt-5 divide-y divide-stone-100 border-y border-stone-100 text-sm">
              <div v-if="spot.hoursText" class="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt class="font-semibold text-stone-700">営業時間</dt><dd class="whitespace-pre-line text-stone-600">{{ spot.hoursText }}</dd></div>
              <div v-if="spot.holidayText" class="grid grid-cols-[5rem_1fr] gap-3 py-3"><dt class="font-semibold text-stone-700">定休日</dt><dd class="whitespace-pre-line text-stone-600">{{ spot.holidayText }}</dd></div>
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
.spot-preview-pin {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border: 3px solid white;
  border-radius: 9999px 9999px 9999px 0;
  background: var(--pin-color);
  box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
  color: white;
  font-weight: 800;
  transform: rotate(-45deg);
}

.spot-preview-pin > * {
  transform: rotate(45deg);
}
</style>
