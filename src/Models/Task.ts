import mongoose, { model } from "mongoose";

const task = new mongoose.Schema(
  {
    // Status can be of three types: complete, incomplete, non-solvable
    status: {
      type: String,
      required: true,
    },
    // Currently supported types: image-captcha
    type: {
      type: String,
      required: true,
    },
    // Difficulty level is of 4 types: easy, normal, hard, very-hard
    difficulty: {
      type: String,
    },
    captcha: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Task = model("Task", task);

export default Task;
