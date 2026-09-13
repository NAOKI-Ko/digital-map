<script setup lang="ts">
import AppDialog from '~/components/ui/AppDialog.vue'
import type { SpotDuplicateMatch } from '~~/shared/types/spot-duplicate'
defineProps<{ open: boolean, matches: SpotDuplicateMatch[] }>()
defineEmits<{ cancel: [], continue: [] }>()
</script>
<template>
  <AppDialog :open="open" title="同名のSpotがあります" description="重複登録は可能です。既存Spotを確認して、このまま保存するか選んでください。" @close="$emit('cancel')">
    <ul class="divide-y rounded-lg border"><li v-for="match in matches" :key="match.id" class="p-3 text-sm"><b>{{ match.name }}</b><p class="mt-1 text-stone-600">{{ match.floorName }} · {{ match.positioned ? '配置済み' : '位置未設定' }} · {{ match.categoryNames.join(' / ') || 'Categoryなし' }}</p></li></ul>
    <div class="mt-5 flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2 text-sm font-semibold" @click="$emit('cancel')">入力へ戻る</button><button type="button" class="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-semibold text-white" @click="$emit('continue')">重複を承知して保存</button></div>
  </AppDialog>
</template>
