import 'server-only';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const KNOWN_TAGS = ['climate-state', 'climate-municipal', 'politics', 'co2'] as const;
type KnownTag = (typeof KNOWN_TAGS)[number];

export async function POST(request: Request) {
  let tags: KnownTag[];

  try {
    const body = await request.json();
    if (body.tags && Array.isArray(body.tags)) {
      tags = body.tags.filter((t: unknown) => KNOWN_TAGS.includes(t as KnownTag));
      if (tags.length === 0) {
        return NextResponse.json({ error: 'no valid tags provided', known: KNOWN_TAGS }, { status: 400 });
      }
    } else {
      // Sem campo tags → invalida tudo
      tags = [...KNOWN_TAGS];
    }
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  tags.forEach(tag => revalidateTag(tag, { expire: 0 }));

  return NextResponse.json({ revalidated: tags });
}
