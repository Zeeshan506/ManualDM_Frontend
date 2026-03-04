type RetryConfig = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  minIntervalMs?: number;
  throttleKey?: string;
  dedupe?: boolean;
  dedupeKey?: string;
  retry?: RetryConfig;
  allowRetry?: boolean;
};

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MIN_INTERVAL_MS = 250;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_BASE_DELAY_MS = 350;
const DEFAULT_RETRY_MAX_DELAY_MS = 1500;

const lastRequestAtByKey = new Map<string, number>();
const inFlightRequests = new Map<string, Promise<Response>>();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isIdempotentMethod = (method: string) => {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
};

const shouldRetryStatus = (status: number) => {
  return status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const parseRetryAfterMs = (headerValue: string | null) => {
  if (!headerValue) {
    return null;
  }

  const numericSeconds = Number(headerValue);
  if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
    return numericSeconds * 1000;
  }

  const retryDate = Date.parse(headerValue);
  if (!Number.isFinite(retryDate)) {
    return null;
  }

  return Math.max(0, retryDate - Date.now());
};

const getBackoffDelay = (attempt: number, baseDelayMs: number, maxDelayMs: number) => {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt));
  const jitter = Math.floor(Math.random() * 120);
  return exponential + jitter;
};

const normalizeMethod = (method?: string) => {
  return (method ?? "GET").toUpperCase();
};

async function throttleRequest(method: string, url: string, minIntervalMs: number, throttleKey?: string) {
  if (!isIdempotentMethod(method)) {
    return;
  }

  const key = throttleKey ?? `${method}:${url}`;
  const now = Date.now();
  const lastAt = lastRequestAtByKey.get(key) ?? 0;
  const waitMs = Math.max(0, minIntervalMs - (now - lastAt));

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastRequestAtByKey.set(key, Date.now());
}

function createTimeoutSignal(externalSignal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, timeoutMs);

  const abortFromExternal = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }
  }

  const cleanup = () => {
    window.clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromExternal);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    wasExternallyAborted: () => Boolean(externalSignal?.aborted),
  };
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
    throttleKey,
    dedupe,
    dedupeKey,
    retry,
    allowRetry,
    signal,
    ...requestInit
  } = options;

  const method = normalizeMethod(requestInit.method);
  const retries = retry?.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = retry?.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const maxDelayMs = retry?.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;
  const canRetry = allowRetry ?? isIdempotentMethod(method);
  const canDedupe = dedupe ?? isIdempotentMethod(method);
  const resolvedDedupeKey = dedupeKey ?? `${method}:${url}`;

  if (canDedupe) {
    const existing = inFlightRequests.get(resolvedDedupeKey);
    if (existing) {
      return existing.then((response) => response.clone());
    }
  }

  const executeRequest = async () => {
    await throttleRequest(method, url, minIntervalMs, throttleKey);

    let lastError: unknown = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const timeout = createTimeoutSignal(signal, timeoutMs);

      try {
        const response = await fetch(url, {
          ...requestInit,
          method,
          signal: timeout.signal,
        });
        timeout.cleanup();
        lastResponse = response;

        if (!canRetry || !shouldRetryStatus(response.status) || attempt >= retries) {
          return response;
        }

        const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
        const delayMs = retryAfterMs ?? getBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delayMs);
        continue;
      } catch (error) {
        timeout.cleanup();
        lastError = error;

        if (timeout.wasExternallyAborted()) {
          throw error;
        }

        if (!canRetry || attempt >= retries) {
          throw error;
        }

        const delayMs = getBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delayMs);
      }
    }

    if (lastResponse) {
      return lastResponse;
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed");
  };

  const requestPromise = executeRequest();

  if (canDedupe) {
    inFlightRequests.set(resolvedDedupeKey, requestPromise);
  }

  try {
    const response = await requestPromise;
    return response.clone();
  } finally {
    if (canDedupe) {
      inFlightRequests.delete(resolvedDedupeKey);
    }
  }
}
