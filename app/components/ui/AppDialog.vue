<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}>(), {
  description: '',
  maxWidth: 'md',
})

const emit = defineEmits<{ close: [] }>()
const panel = useTemplateRef<HTMLElement>('panel')
const titleId = `app-dialog-title-${useId()}`
const descriptionId = `app-dialog-description-${useId()}`
let returnFocus: HTMLElement | null = null
let previousBodyOverflow = ''

const maxWidthClass = computed(() => ({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' })[props.maxWidth])

function focusableElements() {
  return [...(panel.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) ?? [])].filter(element => !element.hasAttribute('hidden'))
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const focusable = focusableElements()
  if (!focusable.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    const target = panel.value?.querySelector<HTMLElement>('[autofocus]') ?? focusableElements()[0] ?? panel.value
    target?.focus()
  }
  else {
    document.body.style.overflow = previousBodyOverflow
    await nextTick()
    returnFocus?.focus()
    returnFocus = null
  }
})

onBeforeUnmount(() => {
  if (props.open) document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-stone-950/60 p-4" @click.self="emit('close')" @keydown="handleKeydown">
      <section ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined" tabindex="-1" class="my-8 w-full rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-6" :class="maxWidthClass">
        <h2 :id="titleId" class="text-xl font-bold tracking-tight text-stone-900">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="mt-2 text-sm leading-6 text-stone-600">{{ description }}</p>
        <div class="mt-5"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>
