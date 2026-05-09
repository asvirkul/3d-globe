import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPinData } from './loadPinData';

describe('loadPinData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const validPinResponse = {
    countries: {
      UA: {
        companyCount: 2,
      },
    },
  };

  const invalidPinResponse = {};

  function createFetchMock({
    ok = true,
    contentType = 'application/json',
    json,
    status,
  }: {
    ok?: boolean;
    contentType?: string | null;
    json: unknown;
    status?: number;
  }) {
    return vi.fn(async () => ({
      ok,
      status: status ?? 200,
      headers: {
        get: () => contentType ?? null,
      },
      json: async () => json,
    }));
  }

  it('returns parsed pin data for a valid response', async () => {
    const validResponseFetchMock = createFetchMock({
      json: validPinResponse,
    });
    vi.stubGlobal('fetch', validResponseFetchMock);

    const result = await loadPinData();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(validPinResponse.countries);
    }
  });

  it('returns error for invalid server data', async () => {
    const invalidShapeFetchMock = createFetchMock({
      json: invalidPinResponse,
    });
    vi.stubGlobal('fetch', invalidShapeFetchMock);

    const result = await loadPinData();
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('structure');
    }
  });

  it('returns abort error when aborted', async () => {
    const abortFetchMock = vi.fn(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError');
    });

    vi.stubGlobal('fetch', abortFetchMock);

    const result = await loadPinData();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('aborted');
    }
  });

  it('returns false when iso is in lowercase', async () => {
    const lowercasePinResponse = {
      countries: {
        cz: {
          companyCount: 1,
        },
      },
    };

    vi.stubGlobal('fetch', createFetchMock({ json: lowercasePinResponse }));

    const result = await loadPinData();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('structure');
    }
  });

  it('returns false for invalid content type', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        json: validPinResponse,
        contentType: 'text/html',
      })
    );

    const result = await loadPinData();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('content');
    }
  });

  it('returns error for non-ok response', async () => {
    vi.stubGlobal('fetch', createFetchMock({ ok: false, json: null, status: 404 }));
    const result = await loadPinData();
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toContain('Error loading');
    }
  });
});
