import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // Rich text
  isPinned: { type: Boolean, default: false },
  isPopup: { type: Boolean, default: false },
  expirationDate: { type: Date },
  priorityLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  images: [{ type: String }],
  links: [{ type: String }],
}, { timestamps: true });

export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
