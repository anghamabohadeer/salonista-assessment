import { ApiError } from '../src/api/ApiError';
import { request } from '../src/api/httpClient';

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

/** Awaits a request expected to fail and returns its ApiError. */
const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (error: ApiError) => error,
  );

describe('httpClient.request', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    globalThis.fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('unwraps the data envelope and builds query strings', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: [{ id: 1 }] }));

    await expect(
      request('/salons', { query: { search: 'gel & nails', empty: '' } }),
    ).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/salons?search=gel%20%26%20nails',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON bodies for POST requests', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { data: { id: 7 } }));

    await request('/bookings', { method: 'POST', body: { a: 1 } });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/bookings',
      expect.objectContaining({
        method: 'POST',
        body: '{"a":1}',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('maps API error bodies to ApiError with code and status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        error: { code: 'SLOT_UNAVAILABLE', message: 'Slot taken' },
      }),
    );

    const error = await captureError(request('/bookings'));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 409,
      code: 'SLOT_UNAVAILABLE',
      message: 'Slot taken',
    });
    expect(error.isRetryable).toBe(false);
  });

  it('maps fetch failures to a retryable network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const error = await captureError(request('/salons'));
    expect(error).toMatchObject({ kind: 'network' });
    expect(error.message).toMatch(/Unable to reach the server/);
    expect(error.isRetryable).toBe(true);
  });

  it('reports non-JSON responses as invalid', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    } as Response);

    await expect(request('/salons')).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 502,
    });
  });
});
