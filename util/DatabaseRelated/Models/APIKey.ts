import mongoose from "mongoose";

const APIKeySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  },
  api_key: {
    type: String,
    required: true
  }
}, {timestamps: true})


const APIKey = mongoose.model("APIKey", APIKeySchema);

export default APIKey;
