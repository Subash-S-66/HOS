import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Event from "@/models/Event";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/events/[id]">) {
  if (!(await getAdminSession())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
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

    await connectToDatabase();
    const event = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        date: start,
        endsAt: new Date(start.getTime() + duration * 60_000),
        hidden,
        votingEnabled: Boolean(votingEnabled),
        recurrenceDays: recurrence,
        votingStartsBeforeDays: votingStartsBefore,
        votingEndsBeforeMinutes: votingEndsBefore,
        createDelayDays: Number(createDelayDays) || 0,
        maxParticipants: limit,
        color: color || "#00f3ff"
      },
      { new: true, runValidators: true },
    );
    return event
      ? NextResponse.json(event)
      : NextResponse.json({ message: "Event not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/events/[id]">) {
  if (!(await getAdminSession())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    await connectToDatabase();
    const event = await Event.findByIdAndDelete(id);
    return event
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ message: "Event not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
