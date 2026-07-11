import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Leaderboard } from '@/lib/models/Leaderboard';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'power';

    await dbConnect();

    // Sort parameter mapping
    const sortParams: Record<string, string> = {
      power: '-highestPower',
      kills: '-highestKills',
      donations: '-mostDonations'
    };

    const sortField = sortParams[category] || '-highestPower';

    const items = await Leaderboard.find({}).populate('memberId').sort(sortField).limit(50);

    // Transform into standard format
    const transformed = items.map((item, index) => {
       const member = item.memberId as any;
       return {
         rank: index + 1,
         name: member?.inGameName || 'Unknown',
         value: category === 'power' ? item.highestPower : category === 'kills' ? item.highestKills : item.mostDonations,
       };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
