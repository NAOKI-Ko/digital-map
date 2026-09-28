/** Managed photo associations take precedence over legacy URLs, without double counting. */
export function spotPhotoCount(legacy: unknown, managedCount = 0): number {
  return managedCount > 0 ? managedCount : Array.isArray(legacy) ? legacy.filter(value => typeof value === 'string').length : 0
}
