import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Admin } from '@/lib/models/Admin';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { setupToken, password } = await req.json();

    if (setupToken !== process.env.SETUP_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const adminExists = await Admin.findOne({ username: 'admin' });

    if (adminExists) {
      return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password || 'hosadmin123');

    await Admin.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    return NextResponse.json({ message: 'Admin created successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to setup admin' }, { status: 500 });
  }
}
