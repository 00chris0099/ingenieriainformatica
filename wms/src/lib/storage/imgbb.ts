// imgBB Image Upload Service
// API Docs: https://api.imgbb.com/

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_BASE_URL = 'https://api.imgbb.com/1';

export interface ImgBBResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
  };
  error?: { message: string; status_code: number };
}

export async function uploadImage(
  base64Data: string,
  name?: string
): Promise<ImgBBResponse> {
  if (!IMGBB_API_KEY) {
    console.warn('[imgBB] API key not configured');
    return { success: false, error: { message: 'imgBB API key not configured', status_code: 500 } };
  }

  // Remove data:image/...;base64, prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', cleanBase64);
  if (name) formData.append('name', name);

  try {
    const response = await fetch(`${IMGBB_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: {
          url: result.data.url,
          display_url: result.data.display_url,
          delete_url: result.data.delete_url,
          width: result.data.width,
          height: result.data.height,
          size: result.data.size,
          time: result.data.time,
        },
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('[imgBB] Upload error:', error);
    return { success: false, error: { message: 'Network error', status_code: 500 } };
  }
}

export async function uploadImageFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<ImgBBResponse> {
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return uploadImage(dataUrl, filename);
}

export function getPlaceholderUrl(text: string, width: number = 600, height: number = 600): string {
  return '';
}
