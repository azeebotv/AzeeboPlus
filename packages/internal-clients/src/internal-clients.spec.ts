import axios from 'axios';
import { ServiceClient } from './index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ServiceClient', () => {
  let client: ServiceClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false) as any;

    client = new ServiceClient({
      baseURL: 'http://localhost:3000',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create an axios instance with correct baseURL', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:3000',
      })
    );
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });

      const result = await client.get('/users/1');

      expect(result).toEqual({ id: 1 });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1', undefined);
    });
  });

  describe('post', () => {
    it('should make POST request with data and idempotency key', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1 } });

      const result = await client.post('/users', { name: 'Test' });

      expect(result).toEqual({ id: 1 });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/users',
        { name: 'Test' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
    });

    it('should use provided idempotency key', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1 } });

      await client.post('/users', { name: 'Test' }, {
        headers: { 'Idempotency-Key': 'custom-key' },
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/users',
        { name: 'Test' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': 'custom-key',
          }),
        })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request with idempotency key', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: { id: 1 } });

      await client.put('/users/1', { name: 'Updated' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/users/1',
        { name: 'Updated' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
    });
  });

  describe('patch', () => {
    it('should make PATCH request with idempotency key', async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: { id: 1 } });

      await client.patch('/users/1', { name: 'Patched' });

      expect(mockAxiosInstance.patch).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

      const result = await client.delete('/users/1');

      expect(result).toEqual({ success: true });
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1', undefined);
    });
  });

  describe('retry logic', () => {
    it('should retry on 500 errors', async () => {
      const error500 = new Error('Server Error');
      (error500 as any).response = { status: 500 };
      (error500 as any).code = undefined;
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockAxiosInstance.get
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce({ data: { id: 1 } });

      const result = await client.get('/users/1');
      expect(result).toEqual({ id: 1 });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 errors', async () => {
      const error503 = new Error('Service Unavailable');
      (error503 as any).response = { status: 503 };
      (error503 as any).code = undefined;
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockAxiosInstance.get
        .mockRejectedValueOnce(error503)
        .mockResolvedValueOnce({ data: { id: 1 } });

      const result = await client.get('/users/1');
      expect(result).toEqual({ id: 1 });
    });

    it('should not retry on 400 errors', async () => {
      const error400 = new Error('Bad Request');
      (error400 as any).response = { status: 400 };
      (error400 as any).code = undefined;
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockAxiosInstance.get.mockRejectedValueOnce(error400);

      await expect(client.get('/users/1')).rejects.toThrow('Bad Request');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should throw after all retries exhausted', async () => {
      const error500 = new Error('Server Error');
      (error500 as any).response = { status: 500 };
      (error500 as any).code = undefined;
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockAxiosInstance.get.mockRejectedValue(error500);

      await expect(client.get('/users/1')).rejects.toThrow('Server Error');
      // Default maxRetries is 3, so 1 initial + 3 retries = 4 calls
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    }, 15000);
  });
});
