import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 5: Media Upload & S3 Presigning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests S3 presigned upload URL with MIME type enforcement', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        uploadUrl: 'https://s3.eu-west-1.amazonaws.com/uploads.azeeboplus.com/creators/video-42.mp4?X-Amz-Signature=abc',
        key: 'creators/video-42.mp4',
        cacheControl: 'public, max-age=86400',
        cachePolicy: 'long-lived',
      },
    });

    const res = await apiClient.post('/api/v1/media/upload/video', {
      filename: 'dance_challenge.mp4',
      mimetype: 'video/mp4',
      sizeBytes: 15480000,
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/media/upload/video', {
      filename: 'dance_challenge.mp4',
      mimetype: 'video/mp4',
      sizeBytes: 15480000,
    });
    expect(res.data?.uploadUrl).toContain('amazonaws.com');
    expect(res.data?.cachePolicy).toBe('long-lived');
  });

  it('rejects disallowed file types at the validation layer', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 422,
        data: { message: 'Unsupported media format. Allowed: mp4, mov, webm', code: 'INVALID_MIME' },
      },
    });

    await expect(
      apiClient.post('/api/v1/media/upload/video', {
        filename: 'malicious.exe',
        mimetype: 'application/x-msdownload',
        sizeBytes: 1000,
      })
    ).rejects.toMatchObject({
      response: {
        status: 422,
        data: { code: 'INVALID_MIME' },
      },
    });
  });
});
