const TAG_REGEX = /<\/?[^>]+(>|$)/g
const WHITESPACE_REGEX = /\s+/g

export function sanitizeText(value: string, maxLength = 160) {
  if (!value) return ''
  return value
    .replace(TAG_REGEX, '')
    .replace(/\0/g, '')
    .replace(WHITESPACE_REGEX, ' ')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeNullableText(value: string | null | undefined, maxLength = 160) {
  if (!value) return null
  const sanitized = sanitizeText(value, maxLength)
  return sanitized.length ? sanitized : null
}

export function sanitizeUrl(value: string | null | undefined) {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}
