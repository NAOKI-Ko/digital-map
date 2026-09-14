<script setup lang="ts">
import { termsJa } from '~~/content/legal/terms.ja'
useSeoMeta({ title: '利用規約 | Digital Map Platform', description: 'Digital Map Platformの利用規約です。' })
</script>
<template><LegalDocument :document="termsJa" /></template>
