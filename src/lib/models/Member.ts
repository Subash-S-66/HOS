import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  inGameName: { type: String, required: true },
  server: { type: Number, required: true },
  alliance: { type: String, required: true },
  role: { type: String, required: true },
  power: { type: Number, required: true },
  kills: { type: Number, required: true },
  rank: { type: String, required: true },
  country: { type: String, required: true },
  favoriteGeneral: { type: String },
  favoriteTroopType: { type: String },
  profileImage: { type: String },
  shortBiography: { type: String },
  socialLinks: { type: Object },
}, { timestamps: true });

export const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);
