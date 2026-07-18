import { fallbackEmrData } from '../data/fallback'
import {
  loadBackendWorkspaceData,
  saveBackendWorkspaceData,
} from './backendWorkspaceStore'
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
    const remoteWorkspace = await saveBackendWorkspaceData(localSnapshot)
    if (remoteWorkspace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteWorkspace))
      return remoteWorkspace
    }

    return localSnapshot
  } catch (error) {
    console.error('Backend save failed, using local cache.', error)
    return localSnapshot
  }
}

export async function loadWorkspaceData() {
  try {
    const remoteWorkspace = await loadBackendWorkspaceData()
    if (remoteWorkspace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteWorkspace))
      return remoteWorkspace
    }
  } catch (error) {
    console.error('Backend load failed, falling back to local cache.', error)
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
    const remoteWorkspace = await saveBackendWorkspaceData(fallbackEmrData)
    if (remoteWorkspace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteWorkspace))
      return remoteWorkspace
    }

    return writeLocalWorkspace(fallbackEmrData)
  } catch (error) {
    console.error('Backend reset failed, restoring local fallback.', error)
    return writeLocalWorkspace(fallbackEmrData)
  }
}
