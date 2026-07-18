import { tmpdir } from 'node:os'
import path from 'node:path'

function shouldUseTempFallbackStorage() {
  return Boolean(process.env.VERCEL)
}

function getWritableFallbackBaseDir() {
  if (shouldUseTempFallbackStorage()) {
    return path.join(tmpdir(), 'bluecaresolutions-fallback')
  }

  return new URL('../../data/', import.meta.url)
}

export function getFallbackDataDirectory() {
  return getWritableFallbackBaseDir()
}

export function getFallbackDataFile(fileName) {
  const baseDir = getWritableFallbackBaseDir()

  if (typeof baseDir === 'string') {
    return path.join(baseDir, fileName)
  }

  return new URL(fileName, baseDir)
}

export function getBundledDataFile(relativePath) {
  return new URL(relativePath, import.meta.url)
}
