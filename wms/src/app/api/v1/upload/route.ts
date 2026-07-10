import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEYS = [
  'ae48dcd79f2998233dbbf9a3e857ad33',
  'fe53076752f90c81d64ebd7542a51f31',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Try each API key
    for (const apiKey of IMGBB_API_KEYS) {
      try {
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: imgbbFormData,
        });

        const data = await response.json();

        if (data.success) {
          return NextResponse.json({
            success: true,
            url: data.data.url,
            deleteUrl: data.data.delete_url,
          });
        }
      } catch (err) {
        console.error(`imgBB upload failed with key ${apiKey.substring(0, 8)}...:`, err);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'All upload attempts failed',
    }, { status: 500 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
