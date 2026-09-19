<script setup lang="ts">
import SaveFeedback from './SaveFeedback.vue'
defineProps<{ state: 'idle' | 'saving' | 'success' | 'error', message?: string }>()
</script>
<template><SaveFeedback :state="state" :message="message" /></template>
