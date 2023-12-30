import mongoose from "mongoose";

export default interface APIKeyData {
  user_id: string | mongoose.Types.ObjectId;
  api_key: string;
  is_enabled: boolean;
}
