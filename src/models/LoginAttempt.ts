import mongoose, { Schema, Document } from "mongoose";

export interface ILoginAttempt extends Document {
  ip: string;
  createdAt: Date;
}

const LoginAttemptSchema: Schema = new Schema({
  ip: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 15 * 60 },
});

const LoginAttempt =
  mongoose.models.LoginAttempt ||
  mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);

export default LoginAttempt;
