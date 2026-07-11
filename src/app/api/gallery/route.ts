import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Gallery } from '@/lib/models/Gallery';

export async function GET() {
  try {
    await dbConnect();
    const items = await Gallery.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
  }
}
