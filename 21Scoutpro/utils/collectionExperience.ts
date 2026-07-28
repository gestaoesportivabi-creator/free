export type CollectionExperience = 'current' | 'shell';

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

export function resolveCollectionExperience(
  searchParams?: URLSearchParams | string | null
): CollectionExperience {
  const params = coerceSearchParams(searchParams);

  const experience = normalizeCollectionFlag(params.get('coleta'));

  if (experience === 'shell') {
    return 'shell';
  }

  return 'current';
}

export function getCollectionExperienceQuery(
  searchParams?: URLSearchParams | string | null
): string {
  const params = coerceSearchParams(searchParams);
  const experience = normalizeCollectionFlag(params.get('coleta'));

  if (experience === 'shell') {
    return '?coleta=shell';
  }

  if (experience === 'atual' || experience === 'current') {
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
