<script setup lang="ts">
import VisitorMapExperience from '~/components/map/VisitorMapExperience.vue'
import type { PublicMapResponse } from '~~/shared/types/public-map'
import { normalizeLocale } from '~~/shared/i18n/messages'
import { buildLocaleLinks, buildPublicLocaleUrl } from '~~/shared/utils/seo'

const route = useRoute()
const mapSlug = computed(() => String(route.params.mapSlug ?? ''))
const requestedLocale = computed(() => normalizeLocale(route.query.lang))
const { data, error, status } = await useFetch<PublicMapResponse>(
  () => `/api/public/${encodeURIComponent(mapSlug.value)}`,
  { query: computed(() => requestedLocale.value === 'en' ? { lang: 'en' } : {}) },
)
const publicBaseUrl = useRuntimeConfig().public.publicBaseUrl as string
const localeUrl = (locale: 'ja' | 'en') => buildPublicLocaleUrl(publicBaseUrl, mapSlug.value, locale)
const absoluteImage = computed(() => data.value?.map.seo.imageUrl ? new URL(data.value.map.seo.imageUrl, publicBaseUrl).toString() : undefined)

useSeoMeta({
  title: () => data.value?.map.seo.title ? `${data.value.map.seo.title} | デジタルマップ` : '公開マップ | デジタルマップ',
  description: () => data.value?.map.seo.description || undefined,
  robots: () => error.value || !data.value?.map ? 'noindex,nofollow' : 'index,follow',
  ogTitle: () => data.value?.map.seo.title,
  ogDescription: () => data.value?.map.seo.description,
  ogUrl: () => data.value?.map ? localeUrl(data.value.map.locale) : undefined,
  ogImage: () => absoluteImage.value,
  ogType: 'website',
  twitterCard: () => absoluteImage.value ? 'summary_large_image' : 'summary',
  twitterTitle: () => data.value?.map.seo.title,
  twitterDescription: () => data.value?.map.seo.description,
  twitterImage: () => absoluteImage.value,
})
useHead(() => ({
  htmlAttrs: { lang: data.value?.map.locale ?? 'ja' },
  link: data.value?.map ? buildLocaleLinks(publicBaseUrl, mapSlug.value, data.value.map.locale, data.value.map.enabledLocales) : [],
  meta: data.value?.map ? [{ property: 'og:locale', content: data.value.map.locale === 'en' ? 'en_US' : 'ja_JP' }] : [],
}))
</script>

<template>
  <VisitorMapExperience :response="data" :status="status" :error="Boolean(error)" />
</template>
