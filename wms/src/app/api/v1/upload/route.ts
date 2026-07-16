import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!IMGBB_API_KEY) {
      return NextResponse.json({ error: 'IMGBB API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append('image', image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
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

    return NextResponse.json({
      success: false,
      error: 'Upload failed',
    }, { status: 500 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
