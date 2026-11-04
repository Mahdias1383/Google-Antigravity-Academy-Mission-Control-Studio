export interface NormalizedErrorInfo {
  name: string;
  message: string;
  stackLines: string[];
}

export interface ErrorIncidentReport {
  incidentId: string;
  portalScope: string;
  timestampIso: string;
  errorName: string;
  errorMessage: string;
  stackLines: string[];
  componentStackLines: string[];
}

export function parseStackLines(stack?: string | null, maxLines = 8): string[] {
  if (!stack) return [];
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, maxLines);
}

export function normalizeRuntimeError(err: unknown): NormalizedErrorInfo {
  if (err instanceof Error) {
    return {
      name: err.name || 'RuntimeError',
      message: err.message || 'Unexpected runtime exception',
      stackLines: parseStackLines(err.stack),
    };
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return {
      name: 'RuntimeError',
      message: err.trim(),
      stackLines: [],
    };
  }
  return {
    name: 'UnknownRuntimeError',
    message: 'An unexpected error occurred in the portal view.',
    stackLines: [],
  };
}

export function buildErrorIncidentReport(
  err: unknown,
  portalScope = 'global',
  componentStack?: string | null
): ErrorIncidentReport {
  const norm = normalizeRuntimeError(err);
  const hash = Math.abs(
    norm.message.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
  )
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');

  return {
    incidentId: `INC-${portalScope.toUpperCase()}-${hash}`,
    portalScope,
    timestampIso: new Date().toISOString(),
    errorName: norm.name,
    errorMessage: norm.message,
    stackLines: norm.stackLines,
    componentStackLines: parseStackLines(componentStack, 6),
  };
}

export function shouldAutoResetBoundary(
  prevKeys?: ReadonlyArray<unknown>,
  nextKeys?: ReadonlyArray<unknown>
): boolean {
  if (!prevKeys || !nextKeys) return false;
  if (prevKeys.length !== nextKeys.length) return true;
  for (let i = 0; i < prevKeys.length; i++) {
    if (!Object.is(prevKeys[i], nextKeys[i])) return true;
  }
  return false;
}
