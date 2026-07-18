export function parseJsonField(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function toJsonString(value, fallback = {}) {
  return JSON.stringify(value ?? fallback)
}
