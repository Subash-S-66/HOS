import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Member } from '@/lib/models/Member';
import { Event } from '@/lib/models/Event';

export async function POST(req: Request) {
  try {
    const { setupToken } = await req.json();

    if (!process.env.SETUP_TOKEN || setupToken !== process.env.SETUP_TOKEN) {
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

    // Seed Gallery
    const { Gallery } = await import('@/lib/models/Gallery');
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      await Gallery.insertMany([
        { title: "SVS Victory", url: "https://via.placeholder.com/600", type: "image", category: "Battles" },
        { title: "Server Crown", url: "https://via.placeholder.com/600", type: "image", category: "Achievements" },
        { title: "Boss Raid", url: "https://via.placeholder.com/600", type: "image", category: "Events" },
        { title: "HOS Family", url: "https://via.placeholder.com/600", type: "image", category: "All" },
      ]);
    }

    // Seed War Reports
    const { WarReport } = await import('@/lib/models/WarReport');
    const reportsCount = await WarReport.countDocuments();
    if (reportsCount === 0) {
      await WarReport.insertMany([
        { enemyAlliance: "[WAR] WarLords", battleDate: new Date(), battleSummary: "Coordinated strike on enemy throne level 35. Complete annihilation of defending forces.", kills: 145000000, losses: 12000000, damageStats: { enemyPowerLost: "8.5B", powerLost: "1.2B" } },
        { enemyAlliance: "[DOM] Dominators", battleDate: new Date(Date.now() - 86400000 * 3), battleSummary: "Successfully held all major points. Enemy forces depleted by zero hour.", kills: 85000000, losses: 5000000, damageStats: { enemyPowerLost: "2.1B", powerLost: "500M" } }
      ]);
    }

    // Seed Leaderboards
    const { Leaderboard } = await import('@/lib/models/Leaderboard');
    const leaderboardsCount = await Leaderboard.countDocuments();
    if (leaderboardsCount === 0 && membersCount === 0) { // Assuming Member got seeded above
       const members = await Member.find({});
       for (const member of members) {
          await Leaderboard.create({
            memberId: member._id,
            highestPower: member.power,
            highestKills: member.kills,
            mostDonations: Math.floor(Math.random() * 50000000)
          });
       }
    }

    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
