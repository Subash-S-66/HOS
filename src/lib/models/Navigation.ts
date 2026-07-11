import mongoose from 'mongoose';

const NavigationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
  targetUrl: { type: String, required: true },
  isExternal: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  visibility: { type: Boolean, default: true },
  category: { type: String },
  openInNewTab: { type: Boolean, default: false },
}, { timestamps: true });

export const Navigation = mongoose.models.Navigation || mongoose.model('Navigation', NavigationSchema);
