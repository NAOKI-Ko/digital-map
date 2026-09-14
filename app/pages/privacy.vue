<script setup lang="ts">
import { privacyJa } from '~~/content/legal/privacy.ja'
useSeoMeta({ title: 'プライバシーポリシー | Digital Map Platform', description: 'Digital Map Platformの情報取扱方針です。' })
</script>
<template><LegalDocument :document="privacyJa" /></template>
