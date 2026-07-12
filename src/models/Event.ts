import { Schema, model, models } from "mongoose";

export interface IEvent {
  title: string;
  description: string;
  date: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
});

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
