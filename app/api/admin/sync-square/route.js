import { NextResponse } from 'next/server';
import { syncSquareCatalog } from '@/lib/squareSync';

export async function POST(request) {
  try {
    const catalogData = await syncSquareCatalog();
    return NextResponse.json({ success: true, message: 'Synchronisation réussie avec Square', data: catalogData });
  } catch (error) {
    console.error("Sync Square Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
