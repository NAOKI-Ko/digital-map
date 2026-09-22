<script setup lang="ts">
import type { PaperMapSource } from '~~/shared/types/paper-map'
import {
  paperDesignCatalog,
  paperDesignConfig,
  recommendPaperDesign,
  designSuitability,
  type PaperDesignId,
} from '~~/shared/utils/paper-map-designs'
const props = defineProps<{
  mapId: string
  source: PaperMapSource
  modelValue: PaperDesignId
}>()
const emit = defineEmits<{ 'update:modelValue': [id: PaperDesignId] }>()
const thumbs = ref<Record<string, string>>({}),
  failed = ref<string[]>([])
const recommendation = computed(() => recommendPaperDesign(props.source))
let generation = 0
async function load() {
  const current = ++generation
  thumbs.value = {}
  failed.value = []
  for (const d of paperDesignCatalog) {
    if (current !== generation) return
    try {
      const r = await $fetch<{ image: string | null }>(
        `/api/maps/${props.mapId}/paper-maps/preview`,
        {
          method: 'POST',
          body: {
            config: paperDesignConfig(d.id, props.source),
            thumbnail: true,
          },
        },
      )
      if (current === generation && r.image) thumbs.value[d.id] = r.image
    } catch {
      if (current === generation) failed.value.push(d.id)
    }
  }
}
onMounted(load)
onBeforeUnmount(() => generation++)
</script>
<template>
  <div class="grid grid-cols-2 gap-3" role="group" aria-label="デザインを選ぶ">
    <button
      v-for="design in paperDesignCatalog"
      :key="design.id"
      type="button"
      class="overflow-hidden rounded-xl border bg-white text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-700"
      :class="
        modelValue === design.id
          ? 'border-sky-800 ring-2 ring-sky-800'
          : 'border-stone-200 hover:border-stone-500'
      "
      :aria-pressed="modelValue === design.id"
      @click="emit('update:modelValue', design.id)"
    >
      <div
        class="flex aspect-[4/3] items-center justify-center bg-stone-100 p-2"
      >
        <img
          v-if="thumbs[design.id]"
          :src="thumbs[design.id]"
          :alt="`${design.name}の登録情報を使った紙面見本`"
          class="max-h-full max-w-full shadow-sm"
        /><span v-else class="px-2 text-xs text-stone-600">{{
          failed.includes(design.id)
            ? '見本を読み込めませんでした'
            : '登録情報で見本を作成中…'
        }}</span>
      </div>
      <div class="p-3">
        <span
          v-if="recommendation.id === design.id"
          class="mb-1 block text-xs font-bold text-sky-800"
          >おすすめ</span
        ><strong class="block text-sm">{{ design.name }}</strong
        ><span class="mt-1 block text-xs leading-5 text-stone-600">{{
          design.use
        }}</span
        ><span class="mt-2 block text-xs text-stone-500">{{
          designSuitability(design.id, source)
        }}</span>
      </div>
    </button>
  </div>
</template>
