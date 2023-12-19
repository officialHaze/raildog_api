import mongoose from "mongoose";

export default interface AdminData {
  level: string;
  user_id: mongoose.Types.ObjectId;
}
