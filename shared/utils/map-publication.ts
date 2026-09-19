export type PublicationToggleAction = 'unpublish' | 'resume-current-release' | 'publish-latest'

export function resolvePublicationToggleAction(isPublished: boolean, currentReleaseId: string | null | undefined): PublicationToggleAction {
  if (isPublished) return 'unpublish'
  return currentReleaseId ? 'resume-current-release' : 'publish-latest'
}
