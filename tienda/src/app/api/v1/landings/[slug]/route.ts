import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const WMS_LANDINGS_DIR = path.join(process.cwd(), '..', 'wms', 'public', 'landings');

interface Props {
  params: { slug: string };
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const filePath = path.join(WMS_LANDINGS_DIR, `${params.slug}.json`);

    if (!existsSync(filePath)) {
      return Response.json({ success: true, data: null });
    }

    const raw = await readFile(filePath, 'utf-8');
    const landing = JSON.parse(raw);

    return Response.json({ success: true, data: landing });
  } catch {
    return Response.json({ success: true, data: null });
  }
}
