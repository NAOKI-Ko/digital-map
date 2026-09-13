<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

const props = defineProps<{ dirty: boolean }>()
const open = ref(false)
const pendingDestination = ref('')
let bypassNextNavigation = false

function beforeUnload(event: BeforeUnloadEvent) {
  if (!props.dirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

onBeforeRouteLeave((to) => {
  if (!props.dirty || bypassNextNavigation) return true
  pendingDestination.value = to.fullPath
  open.value = true
  return false
})

function stay() {
  open.value = false
  pendingDestination.value = ''
}

async function discard() {
  const destination = pendingDestination.value
  open.value = false
  pendingDestination.value = ''
  bypassNextNavigation = true
  await navigateTo(destination)
}
</script>

<template>
  <ConfirmDialog :open="open" title="未保存の変更があります" message="この画面を離れると、保存していない変更は失われます。" confirm-label="破棄して移動" cancel-label="編集を続ける" destructive @cancel="stay" @confirm="discard" />
</template>
