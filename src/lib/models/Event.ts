import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  images: [{ type: String }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }], // For registration
}, { timestamps: true });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
