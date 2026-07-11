import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Member } from '@/lib/models/Member';
import { Event } from '@/lib/models/Event';

export async function POST(req: Request) {
  try {
    const { setupToken } = await req.json();

    if (setupToken !== process.env.SETUP_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Seed Members
    const membersCount = await Member.countDocuments();
    if (membersCount === 0) {
      await Member.insertMany([
        { inGameName: "KingSlayer", server: 1895, alliance: "HOS", role: "R5", power: 12500000000, kills: 450000000, rank: "Emperor", country: "US" },
        { inGameName: "ShadowDeath", server: 1895, alliance: "HOS", role: "R4", power: 9200000000, kills: 320000000, rank: "King", country: "UK" },
        { inGameName: "DragonHeart", server: 1895, alliance: "HOS", role: "R4", power: 8700000000, kills: 290000000, rank: "Duke", country: "CA" },
        { inGameName: "IronFist", server: 1895, alliance: "HOS", role: "R4", power: 7900000000, kills: 250000000, rank: "Archduke", country: "AU" },
        { inGameName: "SilentAssassin", server: 1895, alliance: "HOS", role: "R3", power: 5400000000, kills: 180000000, rank: "Earl", country: "DE" },
      ]);
    }

    // Seed Events
    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      await Event.insertMany([
        { title: "Server vs Server (SVS)", description: "Prepare for cross-server warfare. All shields down, maximum aggression authorized.", startDate: new Date(Date.now() + 86400000 * 2), type: "War", participants: [], status: "upcoming" },
        { title: "Battlefield", description: "Coordinated battlefield assault. Mandatory for all R3+ members.", startDate: new Date(Date.now() + 86400000 * 5), type: "Tactical", participants: [], status: "upcoming" },
      ]);
    }

    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
