import mongoose from 'mongoose';

const LeaderboardSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  highestPower: { type: Number, default: 0 },
  highestKills: { type: Number, default: 0 },
  mostActive: { type: Number, default: 0 },
  mostDonations: { type: Number, default: 0 },
  mostRallyLeads: { type: Number, default: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'all-time'], default: 'all-time' },
}, { timestamps: true });

export const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', LeaderboardSchema);
