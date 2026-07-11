import mongoose from 'mongoose';

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }, // Cloudinary URL
  type: { type: String, enum: ['image', 'video', 'gif'], required: true },
  album: { type: String },
  category: { type: String },
  width: { type: Number },
  height: { type: Number },
}, { timestamps: true });

export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);
