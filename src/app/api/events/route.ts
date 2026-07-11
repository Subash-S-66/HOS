import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Event } from '@/lib/models/Event';

export async function GET() {
  try {
    await dbConnect();
    const events = await Event.find({}).sort({ startDate: 1 });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
