import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Event from "@/models/Event";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { participantId, gameName, action } = await req.json();
    if (typeof participantId !== "string" || !/^[a-zA-Z0-9-]{16,100}$/.test(participantId)) {
      return NextResponse.json({ message: "A valid participant id is required" }, { status: 422 });
    }
    if (action !== "join" && action !== "leave") return NextResponse.json({ message: "A valid participation action is required" }, { status: 422 });
    await connectToDatabase();
    const event = await Event.findById(id).select("+participants.participantId");
    if (!event || event.hidden || event.endsAt <= new Date()) return NextResponse.json({ message: "Event is no longer available" }, { status: 404 });
    if (!event.votingEnabled) return NextResponse.json({ message: "Participation is disabled" }, { status: 409 });
    if (action === "leave") {
      event.participants = (event.participants as Array<{ participantId: string; gameName: string }>).filter((participant) => participant.participantId !== participantId);
    } else {
      const name = typeof gameName === "string" ? gameName.trim().slice(0, 40) : "";
      if (!name) return NextResponse.json({ message: "Your in-game name is required" }, { status: 422 });
      const participant = (event.participants as Array<{ participantId: string; gameName: string }>).find((item) => item.participantId === participantId);
      if (participant) participant.gameName = name;
      else event.participants.push({ participantId, gameName: name });
    }
    await event.save();
    const value = event.toObject();
    return NextResponse.json({ ...value, participants: (value.participants as Array<{ gameName: string }>).map(({ gameName }) => ({ gameName })) });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
