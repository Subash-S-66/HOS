import mongoose from 'mongoose';

const WarReportSchema = new mongoose.Schema({
  enemyAlliance: { type: String, required: true },
  battleDate: { type: Date, required: true },
  battleSummary: { type: String, required: true },
  screenshots: [{ type: String }],
  videos: [{ type: String }],
  damageStats: { type: Object },
  kills: { type: Number },
  losses: { type: Number },
  comments: [{
    user: { type: String },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  likes: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  category: { type: String },
}, { timestamps: true });

export const WarReport = mongoose.models.WarReport || mongoose.model('WarReport', WarReportSchema);
