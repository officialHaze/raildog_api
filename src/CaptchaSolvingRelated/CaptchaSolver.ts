import fs from "fs";
import Task from "../Models/Task";
import mongoose from "mongoose";
import Worker from "../Models/Worker";
import { pathToFileURL } from "url";

export default class CaptchaSolver {
  public async createTask(captchaFilepath: string) {
    const create = async (data: string) => {
      try {
        const newTask = new Task({
          status: "incomplete",
          type: "image-captcha",
          captcha: data,
        });

        const savedTask = await newTask.save();
        const taskID = savedTask._id;

        // Assign the task to any available worker
        const availableWorker = await Worker.findOneAndUpdate(
          { is_available: true },
          { task_id: taskID },
          { new: true }
        ); // TODO:  findOne will be find all and then select a random worker

        if (!availableWorker) throw new Error("No workers available at the moment!").message;

        console.log("Task assigned to: ", availableWorker);

        return taskID;
      } catch (err) {
        throw err;
      }
    };

    // Read the file and craete the task
    console.log("Creating File URL...");
    const fileurl = pathToFileURL(captchaFilepath).href;
    console.log(fileurl);
    try {
      console.log("Creating a new task...");
      const taskID = await create(fileurl);

      console.log("Task created: " + taskID);
      return `${taskID}`;
    } catch (err) {
      throw err;
    }
  }
}
