import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatUser', required: true },
  content: { type: String, required: true },
  isPinned: { type: Boolean, default: false },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatUser' }]
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  isEdited: { type: Boolean, default: false },
  attachments: [{ type: String }], // URLs to images/files
}, { timestamps: true });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
