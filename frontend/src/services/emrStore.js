import { fallbackEmrData } from '../data/fallback'
import {
  loadSupabaseWorkspaceData,
  resetSupabaseWorkspaceData,
  saveSupabaseWorkspaceData,
} from './supabaseStore'
import {
  buildHydratedFallbackWorkspace,
  hydrateWorkspace,
  isClinicWorkspace,
} from './workspaceTransforms'

const STORAGE_KEY = 'bluecare-ayurvedic-clinic-workspace'

function readLocalWorkspace() {
  const savedValue = localStorage.getItem(STORAGE_KEY)
  if (!savedValue) {
    return null
  }

  try {
    const parsed = JSON.parse(savedValue)
    return isClinicWorkspace(parsed) ? hydrateWorkspace(parsed) : null
  } catch {
    return null
  }
}

function writeLocalWorkspace(data) {
  const nextData = hydrateWorkspace(data)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData))
  return nextData
}

export async function saveWorkspaceData(data) {
  const localSnapshot = writeLocalWorkspace(data)

  try {
    return await saveSupabaseWorkspaceData(localSnapshot)
  } catch (error) {
    console.error('Supabase save failed, using local cache.', error)
    return localSnapshot
  }
}

export async function loadWorkspaceData() {
  try {
    const remoteWorkspace = await loadSupabaseWorkspaceData()
    if (remoteWorkspace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteWorkspace))
      return remoteWorkspace
    }
  } catch (error) {
    console.error('Supabase load failed, falling back to local cache.', error)
  }

  const localWorkspace = readLocalWorkspace()
  if (localWorkspace) {
    return localWorkspace
  }

  return writeLocalWorkspace(fallbackEmrData || buildHydratedFallbackWorkspace())
}

export async function resetWorkspaceData() {
  localStorage.removeItem(STORAGE_KEY)

  try {
    const remoteWorkspace = await resetSupabaseWorkspaceData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteWorkspace))
    return remoteWorkspace
  } catch (error) {
    console.error('Supabase reset failed, restoring local fallback.', error)
    return writeLocalWorkspace(fallbackEmrData)
  }
}
