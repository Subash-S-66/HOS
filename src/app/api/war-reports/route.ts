import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { WarReport } from '@/lib/models/WarReport';

export async function GET() {
  try {
    await dbConnect();
    const items = await WarReport.find({}).sort({ battleDate: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch war reports' }, { status: 500 });
  }
}
