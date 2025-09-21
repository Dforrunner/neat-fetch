// TypeScript interfaces
interface FetchOptions extends RequestInit {
  fetchFn?: typeof fetch; // optional injection
  params?: Record<string, any>;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  baseURL?: string;
}

interface HttpError extends Error {
  response?: Response;
  status?: number;
  statusText?: string;
  url?: string;
}

type FetchResult<T = Response> = [T, null] | [null, Error];

interface NeatFetchInstance {
  // Response parsing methods
  json<T = any>(): Promise<FetchResult<T>>;
  text(): Promise<FetchResult<string>>;
  blob(): Promise<FetchResult<Blob>>;
  arrayBuffer(): Promise<FetchResult<ArrayBuffer>>;
  formData(): Promise<FetchResult<FormData>>;
  stream(): Promise<FetchResult<ReadableStream<Uint8Array> | null>>;

  // HTTP method shortcuts
  get<T = any>(): Promise<FetchResult<T>>;
  post<T = any>(data?: any): Promise<FetchResult<T>>;
  put<T = any>(data?: any): Promise<FetchResult<T>>;
  patch<T = any>(data?: any): Promise<FetchResult<T>>;
  delete<T = any>(): Promise<FetchResult<Response>>;
  head(): Promise<FetchResult<Response>>;
  options(): Promise<FetchResult<Response>>;

  // Utility methods
  clone(): NeatFetchInstance;
  timeout(ms: number): NeatFetchInstance;
  retry(count: number, delay?: number): NeatFetchInstance;
  baseURL(url: string): NeatFetchInstance;
  headers(requestHeaders: Record<string, string>): NeatFetchInstance;
  query(queryParams: Record<string, any>): NeatFetchInstance;
  fromResponse(
    response: Response
  ): Pick<
    NeatFetchInstance,
    "json" | "text" | "blob" | "arrayBuffer" | "formData"
  >;

  // Promise interface
  then<TResult1 = FetchResult<Response>, TResult2 = never>(
    onFulfilled?:
      | ((value: FetchResult<Response>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;

  catch<TResult = never>(
    onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<FetchResult<Response> | TResult>;

  finally(onFinally?: (() => void) | null): Promise<FetchResult<Response>>;
}

function normalizeHeaders(
  headers: HeadersInit | undefined
): Record<string, string> {
  if (!headers) return {};

  const entries: [string, string][] =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Array.isArray(headers)
      ? headers
      : Object.entries(headers);

  // normalize keys to lowercase
  return Object.fromEntries(entries.map(([k, v]) => [k.toLowerCase(), v]));
}

async function tupleParseResponse<T = any>(
  response: Response,
  method: keyof Response
): Promise<FetchResult<T>> {
  try {
    const data = await (response[method] as () => Promise<any>)();
    return [data, null];
  } catch (err) {
    return [null, err as Error];
  }
}

class NeatFetch implements NeatFetchInstance {
  private readonly url: string;
  private readonly fetchOptions: FetchOptions;
  private readonly params: Record<string, any>;
  private readonly finalUrl: string;
  private readonly requestInit: RequestInit;
  private readonly timeoutMs?: number;
  private readonly retryCount: number;
  private readonly retryDelayMs: number;
  private readonly headersObj: Record<string, string>;
  private executionPromise?: Promise<FetchResult<Response>>;
  private readonly fetchFn: typeof fetch;

  constructor(url: string, options: FetchOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.url = url;
    this.fetchOptions = { ...options };
    this.headersObj = normalizeHeaders(this.fetchOptions.headers);
    this.params = { ...(options.params || {}) };
    this.timeoutMs = options.timeout;
    this.retryCount = options.retry || 0;
    this.retryDelayMs = options.retryDelay || 1000;

    // Build URL with query parameters
    this.finalUrl = this.buildUrl();

    // Remove custom options from fetch requestInit
    const { params, timeout, retry, retryDelay, baseURL, ...requestInit } =
      options;
    this.requestInit = requestInit;
  }

  private buildUrl(): string {
    let targetUrl = this.url;

    // If baseURL provided and this.url is relative, apply base
    let isAbsolute = false;
    try {
      // If this succeeds, it's absolute (throws for relative)
      new URL(this.url);
      isAbsolute = true;
    } catch {
      isAbsolute = false;
    }

    // Handle baseURL
    if (this.fetchOptions.baseURL && !isAbsolute) {
      const base = this.fetchOptions.baseURL.replace(/\/$/, "");
      const path = this.url.replace(/^\//, "");
      targetUrl = `${base}/${path}`;
    }

    // Handle different URL contexts
    let urlInstance: URL;
    try {
      urlInstance = new URL(targetUrl);
    } catch {
      // If not absolute URL, try with window.location or current context
      if (
        typeof globalThis !== "undefined" &&
        (globalThis as any).window?.location?.origin
      ) {
        urlInstance = new URL(
          targetUrl,
          (globalThis as any).window.location.origin
        );
      } else {
        // Node.js environment - assume it's a relative path
        urlInstance = new URL(targetUrl, "http://localhost");
      }
    }

    // Add query parameters
    Object.entries(this.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => urlInstance.searchParams.append(key, String(v)));
        } else {
          urlInstance.searchParams.append(key, String(value));
        }
      }
    });

    return urlInstance.toString();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeWithRetry(
    attempt: number = 0
  ): Promise<FetchResult<Response>> {
    try {
      const controller = new AbortController();
      const timeoutId = this.timeoutMs
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : null;

      const requestInitWithSignal = {
        ...this.requestInit,
        signal: this.requestInit.signal || controller.signal,
      };

      const response = await this.fetchFn(this.finalUrl, requestInitWithSignal);

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        ) as HttpError;
        error.response = response.clone();
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = this.finalUrl;

        // Handle 429 with Retry-After header
        if (response.status === 429 && response.headers.has("Retry-After")) {
          const ra = response.headers.get("Retry-After")!;
          let retryAfterMs = 0;

          const sec = Number(ra);
          if (!Number.isNaN(sec)) {
            //handle seconds
            retryAfterMs = sec * 1000;
          } else {
            //handle HTTP-date
            const date = Date.parse(ra);
            if (!Number.isNaN(date)) {
              retryAfterMs = Math.max(0, date - Date.now());
            }
          }
          if (retryAfterMs > 0) await this.sleep(retryAfterMs);
        }

        // Retry on 5xx errors or network issues
        if (
          attempt < this.retryCount &&
          (response.status >= 500 || response.status === 429)
        ) {
          await this.sleep(this.retryDelayMs * (attempt + 1));
          return this.executeWithRetry(attempt + 1);
        }

        return [null, error];
      }

      return [response, null];
    } catch (fetchError) {
      // Retry on network errors
      if (
        attempt < this.retryCount &&
        (fetchError as Error).name !== "AbortError"
      ) {
        await this.sleep(this.retryDelayMs * (attempt + 1));
        return this.executeWithRetry(attempt + 1);
      }

      return [null, fetchError as Error];
    }
  }

  private serializeBody(data: any): {
    body?: BodyInit;
    headers?: Record<string, string>;
  } {
    if (data == null) return {};

    // Already valid BodyInit (browser/Node fetch can handle these)
    if (
      data instanceof FormData ||
      data instanceof Blob ||
      data instanceof ArrayBuffer ||
      data instanceof URLSearchParams
    ) {
      return { body: data }; // no headers, browser sets them
    }

    if (typeof data === "string") {
      return { body: data }; // no default Content-Type, user decides
    }

    // For objects: only set Content-Type if user hasn't already
    const headers: Record<string, string> = {};
    if (!this.headersObj["Content-Type"] && !this.headersObj["content-type"]) {
      headers["content-type"] = "application/json";
    }

    return {
      body: JSON.stringify(data),
      headers,
    };
  }

  private async execute(): Promise<FetchResult<Response>> {
    if (!this.executionPromise) {
      this.executionPromise = this.executeWithRetry();
    }
    return this.executionPromise;
  }

  // Make it thenable
  then<TResult1 = FetchResult<Response>, TResult2 = never>(
    onFulfilled?:
      | ((value: FetchResult<Response>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<FetchResult<Response> | TResult> {
    return this.execute().then(null, onRejected);
  }

  finally(onFinally?: (() => void) | null): Promise<FetchResult<Response>> {
    return this.execute().finally(onFinally);
  }

  // Response parsing methods
  async json<T = any>(): Promise<FetchResult<T>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      return [null as any, null];
    }

    try {
      const data = await response.json();
      return [data, null];
    } catch (parseError) {
      return [null, parseError as Error];
    }
  }

  async text(): Promise<FetchResult<string>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    try {
      const data = await response.text();
      return [data, null];
    } catch (parseError) {
      return [null, parseError as Error];
    }
  }

  async blob(): Promise<FetchResult<Blob>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    try {
      const data = await response.blob();
      return [data, null];
    } catch (parseError) {
      return [null, parseError as Error];
    }
  }

  async arrayBuffer(): Promise<FetchResult<ArrayBuffer>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    try {
      const data = await response.arrayBuffer();
      return [data, null];
    } catch (parseError) {
      return [null, parseError as Error];
    }
  }

  async formData(): Promise<FetchResult<FormData>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    try {
      const data = await response.formData();
      return [data, null];
    } catch (parseError) {
      return [null, parseError as Error];
    }
  }

  async stream(): Promise<FetchResult<ReadableStream<Uint8Array> | null>> {
    const [response, error] = await this.execute();

    if (error) {
      return [null, error];
    }

    return [response.body, null];
  }

  // HTTP method convenience functions
  async get<T = any>(): Promise<FetchResult<T>> {
    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "GET",
    });
    return instance.json<T>();
  }

  async post<T = any>(data?: any): Promise<FetchResult<T>> {
    // Serialize the body correctly
    const { body, headers } = this.serializeBody(data);

    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "POST",
      body,
      headers,
    });

    return instance.json<T>();
  }

  async put<T = any>(data?: any): Promise<FetchResult<T>> {
    // Serialize the body correctly
    const { body, headers } = this.serializeBody(data);

    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "PUT",
      body,
      headers,
    });
    return instance.json<T>();
  }

  async patch<T = any>(data?: any): Promise<FetchResult<T>> {
    // Serialize the body correctly
    const { body, headers } = this.serializeBody(data);

    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "PATCH",
      body,
      headers,
    });
    return instance.json<T>();
  }

  async delete(): Promise<FetchResult<Response>> {
    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "DELETE",
    });
    return instance.execute();
  }

  async head(): Promise<FetchResult<Response>> {
    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "HEAD",
    });
    return instance.execute();
  }

  async options(): Promise<FetchResult<Response>> {
    const instance = new NeatFetch(this.url, {
      ...this.fetchOptions,
      method: "OPTIONS",
    });
    return instance.execute();
  }

  // Utility methods for chaining
  clone(): NeatFetchInstance {
    return new NeatFetch(this.url, { ...this.fetchOptions });
  }

  timeout(ms: number): NeatFetchInstance {
    return new NeatFetch(this.url, {
      ...this.fetchOptions,
      timeout: ms,
    });
  }

  retry(count: number, delay: number = 1000): NeatFetchInstance {
    return new NeatFetch(this.url, {
      ...this.fetchOptions,
      retry: count,
      retryDelay: delay,
    });
  }

  baseURL(url: string): NeatFetchInstance {
    return new NeatFetch(this.url, {
      ...this.fetchOptions,
      baseURL: url,
    });
  }

  headers(requestHeaders: Record<string, string>): NeatFetchInstance {
    return new NeatFetch(this.url, {
      ...this.fetchOptions,
      headers: {
        ...this.headersObj,
        ...requestHeaders,
      },
    });
  }

  query(queryParams: Record<string, any>): NeatFetchInstance {
    return new NeatFetch(this.url, {
      ...this.fetchOptions,
      params: {
        ...this.fetchOptions.params,
        ...queryParams,
      },
    });
  }

  fromResponse(
    response: Response
  ): Pick<
    NeatFetchInstance,
    "json" | "text" | "blob" | "arrayBuffer" | "formData"
  > {
    return {
      json: <T = any>() => tupleParseResponse<T>(response, "json"),
      text: () => tupleParseResponse<string>(response, "text"),
      blob: () => tupleParseResponse<Blob>(response, "blob"),
      arrayBuffer: () =>
        tupleParseResponse<ArrayBuffer>(response, "arrayBuffer"),
      formData: () => tupleParseResponse<FormData>(response, "formData"),
    };
  }
}

// Main fetch function
function neatFetch(url: string, config: FetchOptions = {}): NeatFetchInstance {
  return new NeatFetch(url, config);
}

// Create instance with base configuration
function createNeatFetchInstance(
  baseConfig: FetchOptions = {}
): (url: string, instanceConfig?: FetchOptions) => NeatFetchInstance {
  return (url: string, instanceConfig: FetchOptions = {}) => {
    return new NeatFetch(url, {
      ...baseConfig,
      ...instanceConfig,
      fetchFn:
        instanceConfig.fetchFn ??
        baseConfig.fetchFn ??
        globalThis.fetch.bind(globalThis),
      headers: {
        ...normalizeHeaders(baseConfig.headers),
        ...normalizeHeaders(instanceConfig.headers),
      },
      params: {
        ...baseConfig.params,
        ...instanceConfig.params,
      },
    });
  };
}

// Export types and functions
export type { FetchOptions, HttpError, FetchResult, NeatFetchInstance };
export { neatFetch, createNeatFetchInstance };
export default neatFetch;
