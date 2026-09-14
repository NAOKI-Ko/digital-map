export const TERMS_VERSION = '2026-09-14-v1'
export const PRIVACY_VERSION = '2026-09-14-v1'
export const LEGAL_EFFECTIVE_DATE = '2026年9月14日'

export interface LegalSection { heading: string, paragraphs: string[], items?: string[] }
export interface LegalDocument { title: string, version: string, effectiveDate: string, introduction: string, sections: LegalSection[] }
