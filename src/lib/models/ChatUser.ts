import mongoose from 'mongoose';

const ChatUserSchema = new mongoose.Schema({
  inGameName: { type: String, required: true },
  serverNumber: { type: Number, required: true },
  allianceName: { type: String, required: true },
  country: { type: String },
  avatar: { type: String },
  socketId: { type: String },
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

export const ChatUser = mongoose.models.ChatUser || mongoose.model('ChatUser', ChatUserSchema);
