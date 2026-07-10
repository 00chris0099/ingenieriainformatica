import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LANDINGS_DIR = path.join(process.cwd(), 'public', 'landings');

async function ensureDir() {
  if (!existsSync(LANDINGS_DIR)) {
    await mkdir(LANDINGS_DIR, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureDir();
    const files = await readdir(LANDINGS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const landings = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await readFile(path.join(LANDINGS_DIR, file), 'utf-8');
        const data = JSON.parse(content);
        return {
          slug: file.replace('.json', ''),
          ...data,
        };
      })
    );

    return NextResponse.json({ data: landings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list landings' }, { status: 500 });
  }
}
