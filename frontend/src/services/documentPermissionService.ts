import type { Source } from '@/types'

const PERM_KEY = 'unibot_source_permissions'

export function getSourcePermissions(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PERM_KEY) || '{}')
  } catch {
    return {}
  }
}

export function setSourcePermission(docId: string, allowed: boolean): void {
  const perms = getSourcePermissions()
  if (allowed) {
    delete perms[docId]
  } else {
    perms[docId] = false
  }
  localStorage.setItem(PERM_KEY, JSON.stringify(perms))
}

export function isDocumentAllowed(docId: string): boolean {
  const perms = getSourcePermissions()
  if (docId in perms) return perms[docId]
  return true
}

export function isSourceAllowed(source: Source): boolean {
  if (source.isPublic === false) return false
  const key = source.documentId || source.id
  return isDocumentAllowed(key)
}
