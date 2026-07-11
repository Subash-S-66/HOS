import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Member } from '@/lib/models/Member';

export async function GET() {
  try {
    await dbConnect();
    const members = await Member.find({}).sort({ power: -1 });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
