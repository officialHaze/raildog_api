import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    is_verified: {
      type: Boolean,
      required: true,
    },
    // Role can be of 3 types only - Individual, Developer, Business
    role: {
      type: String,
      required: true,
    },
    business_name: {
      type: String,
    },
    verification_code: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

export default User;
