import mongoose, { model } from "mongoose";

const worker = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    full_name: {
      type: String,
      required: true,
    },
    phone_no: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    is_online: {
      type: Boolean,
      required: true,
    },
    is_available: {
      type: Boolean,
      required: true,
    },
    is_verified: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Worker = model("Worker", worker);

export default Worker;
