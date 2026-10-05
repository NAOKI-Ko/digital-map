<script setup lang="ts">
import { getVisitorFacilityPreset, type VisitorPinAppearance } from '~/utils/visitor-facility-summary'

const props = withDefaults(defineProps<{ appearance: VisitorPinAppearance, size?: 'sm' | 'md' }>(), { size: 'md' })
const preset = computed(() => getVisitorFacilityPreset(props.appearance))
</script>

<template>
  <span v-if="preset" class="visitor-facility-symbol" :class="{ 'visitor-facility-symbol--compact': size === 'sm', 'visitor-facility-symbol--with-text': preset.text }" aria-hidden="true">
    <img :src="preset.imageUrl" alt="" draggable="false">
    <span v-if="preset.text" class="visitor-facility-symbol__text">{{ preset.text }}</span>
  </span>
</template>

<style scoped>
.visitor-facility-symbol {
  display: inline-flex;
  box-sizing: border-box;
  width: 2rem;
  height: 2rem;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--visitor-border, #d6dedb);
  border-radius: .5rem;
  background: var(--visitor-surface, white);
  color: var(--visitor-ink, #20342c);
}
.visitor-facility-symbol img { width: 1.5rem; height: 1.5rem; object-fit: contain; }
.visitor-facility-symbol--with-text img { height: 1.125rem; }
.visitor-facility-symbol__text { font-size: .5rem; font-weight: 800; line-height: 1; }
.visitor-facility-symbol--compact { width: 1.5rem; height: 1.5rem; border-radius: .375rem; }
.visitor-facility-symbol--compact img { width: 1.125rem; height: 1.125rem; }
.visitor-facility-symbol--compact.visitor-facility-symbol--with-text img { height: .75rem; }
.visitor-facility-symbol--compact .visitor-facility-symbol__text { font-size: .375rem; }
</style>
