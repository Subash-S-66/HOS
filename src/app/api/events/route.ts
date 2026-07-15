import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Event from "@/models/Event";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { title, description, date, hidden, durationMinutes, votingEnabled, recurrenceDays, votingStartsBeforeDays, votingEndsBeforeMinutes, createDelayDays, maxParticipants, color } = await req.json();
    const duration = Number(durationMinutes);
    const start = new Date(date);
    if (!Number.isInteger(duration) || duration < 1 || Number.isNaN(start.getTime())) {
      return NextResponse.json({ message: "A valid date and duration are required" }, { status: 422 });
    }
    if (start <= new Date()) return NextResponse.json({ message: "Events must be scheduled for a future date and time" }, { status: 422 });
    const recurrence = recurrenceDays === null || recurrenceDays === undefined || recurrenceDays === "" ? null : Number(recurrenceDays);
    if (recurrence !== null && (!Number.isInteger(recurrence) || recurrence < 1 || recurrence > 365)) return NextResponse.json({ message: "Invalid recurrence" }, { status: 422 });
    
    const limit = maxParticipants === null || maxParticipants === undefined || maxParticipants === "" ? null : Number(maxParticipants);
    if (limit !== null && (!Number.isInteger(limit) || limit < 1)) return NextResponse.json({ message: "Invalid max participants" }, { status: 422 });

    const votingStartsBefore = votingStartsBeforeDays === undefined || votingStartsBeforeDays === null || votingStartsBeforeDays === "" ? -1 : Number(votingStartsBeforeDays);
    if (votingStartsBefore !== -1 && (!Number.isInteger(votingStartsBefore) || votingStartsBefore < 1)) {
      return NextResponse.json({ message: "Invalid voting starts before days" }, { status: 422 });
    }

    const votingEndsBefore = votingEndsBeforeMinutes === undefined || votingEndsBeforeMinutes === null || votingEndsBeforeMinutes === "" ? 0 : Number(votingEndsBeforeMinutes);
    if (!Number.isInteger(votingEndsBefore) || votingEndsBefore < 0) {
      return NextResponse.json({ message: "Invalid voting ends before minutes" }, { status: 422 });
    }

    const newEvent = new Event({
      title,
      description,
      date: start,
      endsAt: new Date(start.getTime() + duration * 60_000),
      hidden,
      votingEnabled: Boolean(votingEnabled),
      votingStartsBeforeDays: votingStartsBefore,
      votingEndsBeforeMinutes: votingEndsBefore,
      createDelayDays: Number(createDelayDays) || 0,
      maxParticipants: limit,
      color: color || "#00f3ff",
      recurrenceDays: recurrence
    });
    await newEvent.save();
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();
    const events = await Event.find({ hidden: false, $or: [{ date: { $gte: now } }, { endsAt: { $gte: now } }] }).sort({ date: "asc" });
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 500 });
  }
}
