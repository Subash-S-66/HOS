import mongoose from 'mongoose';

const ToolSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail: { type: String },
  description: { type: String, required: true },
  category: { type: String },
  buttonText: { type: String, default: 'Open Tool' },
  destinationUrl: { type: String, required: true },
  colorTheme: { type: String },
  icon: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
}, { timestamps: true });

export const Tool = mongoose.models.Tool || mongoose.model('Tool', ToolSchema);
