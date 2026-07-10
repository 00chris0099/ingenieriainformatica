import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LANDINGS_DIR = path.join(process.cwd(), 'public', 'landings');

interface Props {
  params: { slug: string };
}

async function ensureDir() {
  if (!existsSync(LANDINGS_DIR)) {
    await mkdir(LANDINGS_DIR, { recursive: true });
  }
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    await ensureDir();
    const filePath = path.join(LANDINGS_DIR, `${params.slug}.json`);

    if (!existsSync(filePath)) {
      return NextResponse.json({ data: null });
    }

    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load landing' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    await ensureDir();
    const body = await request.json();
    const filePath = path.join(LANDINGS_DIR, `${params.slug}.json`);

    const landingData = {
      blocks: body.blocks || [],
      updatedAt: new Date().toISOString(),
    };

    await writeFile(filePath, JSON.stringify(landingData, null, 2));

    return NextResponse.json({ success: true, data: landingData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save landing' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const filePath = path.join(LANDINGS_DIR, `${params.slug}.json`);

    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete landing' }, { status: 500 });
  }
}
