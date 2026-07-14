import { Schema, model, models } from "mongoose";

export interface IEvent {
  title: string;
  description: string;
  date: Date;
  endsAt: Date;
  hidden: boolean;
  votingEnabled: boolean;
  votingStartsBeforeDays?: number;
  votingEndsBeforeMinutes?: number;
  createDelayDays?: number;
  maxParticipants?: number | null;
  color?: string;
  participants: Array<{ participantId: string; gameName: string }>;
  recurrenceDays?: number | null;
  nextOccurrenceCreated: boolean;
}

const EventParticipantSchema = new Schema({
  participantId: { type: String, required: true, select: false },
  gameName: { type: String, required: true, trim: true, maxlength: 40 },
}, { _id: false });

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  hidden: { type: Boolean, default: false },
  votingEnabled: { type: Boolean, default: false },
  votingStartsBeforeDays: { type: Number, default: -1 },
  votingEndsBeforeMinutes: { type: Number, default: 0 },
  createDelayDays: { type: Number, default: 0 },
  maxParticipants: { type: Number, default: null },
  color: { type: String, default: "#00f3ff" },
  participants: { type: [EventParticipantSchema], default: [] },
  recurrenceDays: { type: Number, default: null },
  nextOccurrenceCreated: { type: Boolean, default: false },
});

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
