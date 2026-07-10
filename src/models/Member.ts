import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
  playerName: string;
  alliance: string;
  server: number;
  rank: string;
  power: number;
  kills: number;
  troopSpecialty: string;
  generalPreference: string;
  favoriteBattleMemory: string;
  country: string;
  biography: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema: Schema = new Schema(
  {
    playerName: { type: String, required: true },
    alliance: { type: String, required: true },
    server: { type: Number, required: true },
    rank: { type: String },
    power: { type: Number },
    kills: { type: Number },
    troopSpecialty: { type: String },
    generalPreference: { type: String },
    favoriteBattleMemory: { type: String },
    country: { type: String },
    biography: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
