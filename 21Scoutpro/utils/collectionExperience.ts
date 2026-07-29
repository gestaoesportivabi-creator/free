export const COLLECTION_EXPERIENCE_STORAGE_KEY = 'SCOUT_COLLECTION_EXPERIENCE';
export const CURRENT_COLLECTION_EXPERIENCE = 'current';
export const SHELL_COLLECTION_EXPERIENCE = 'shell';

export type CollectionExperience =
  | typeof CURRENT_COLLECTION_EXPERIENCE
  | typeof SHELL_COLLECTION_EXPERIENCE;

function normalizeCollectionFlag(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function coerceSearchParams(
  searchParams?: URLSearchParams | string | null
): URLSearchParams {
  return typeof searchParams === 'string'
    ? new URLSearchParams(searchParams)
    : searchParams ?? new URLSearchParams();
}

function coerceCollectionExperience(
  value: string | null | undefined
): CollectionExperience | null {
  const normalized = normalizeCollectionFlag(value);

  if (normalized === SHELL_COLLECTION_EXPERIENCE) {
    return SHELL_COLLECTION_EXPERIENCE;
  }

  if (normalized === CURRENT_COLLECTION_EXPERIENCE || normalized === 'atual') {
    return CURRENT_COLLECTION_EXPERIENCE;
  }

  return null;
}

function readStorageValue(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorageValue(key: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getExplicitCollectionExperience(
  searchParams?: URLSearchParams | string | null
): CollectionExperience | null {
  const params = coerceSearchParams(searchParams);
  return coerceCollectionExperience(params.get('coleta'));
}

export function getExperienceActivationRequest(
  searchParams?: URLSearchParams | string | null
): CollectionExperience | null {
  const params = coerceSearchParams(searchParams);
  return coerceCollectionExperience(params.get('experiencia'));
}

export function getStoredCollectionExperience(): CollectionExperience | null {
  return coerceCollectionExperience(readStorageValue(COLLECTION_EXPERIENCE_STORAGE_KEY));
}

export function setStoredCollectionExperience(
  experience: CollectionExperience
): boolean {
  return writeStorageValue(COLLECTION_EXPERIENCE_STORAGE_KEY, experience);
}

export function clearStoredCollectionExperience(): boolean {
  return removeStorageValue(COLLECTION_EXPERIENCE_STORAGE_KEY);
}

export function resolveCollectionExperience(
  searchParams?: URLSearchParams | string | null
): CollectionExperience {
  const explicitExperience = getExplicitCollectionExperience(searchParams);
  if (explicitExperience) {
    return explicitExperience;
  }

  const storedExperience = getStoredCollectionExperience();
  if (storedExperience) {
    return storedExperience;
  }

  return CURRENT_COLLECTION_EXPERIENCE;
}

export function getCollectionExperienceQuery(
  searchParams?: URLSearchParams | string | null
): string {
  const experience = getExplicitCollectionExperience(searchParams);

  if (experience === SHELL_COLLECTION_EXPERIENCE) {
    return '?coleta=shell';
  }

  if (experience === CURRENT_COLLECTION_EXPERIENCE) {
    return '?coleta=atual';
  }

  return '';
}

export function withCollectionExperience(
  path: string,
  searchParams?: URLSearchParams | string | null
): string {
  return `${path}${getCollectionExperienceQuery(searchParams)}`;
}
