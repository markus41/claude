const SOURCE_ID_PREFIX = 'source::';

export function toSourceId(keyOrId: string): string {
  if (keyOrId.startsWith(SOURCE_ID_PREFIX)) {
    return keyOrId;
  }
  return `${SOURCE_ID_PREFIX}${keyOrId}`;
}

export function toSourceKey(keyOrId: string): string {
  return keyOrId.startsWith(SOURCE_ID_PREFIX)
    ? keyOrId.slice(SOURCE_ID_PREFIX.length)
    : keyOrId;
}
