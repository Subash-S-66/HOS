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
    const { title, description, date } = await req.json();
    const newEvent = new Event({ title, description, date });
    await newEvent.save();
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find({}).sort({ date: "desc" });
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
