import fs from "fs";
import Task from "../Models/Task";
import mongoose from "mongoose";
import Worker from "../Models/Worker";
import { pathToFileURL } from "url";
import TaskUpdateArgs from "../Interfaces/UpdateTaskArgs";

export default class CaptchaSolver {
  public solvedCaptcha: string = "";

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

  public async isTaskComplete(taskID: string) {
    console.log("Finding the task from DB...");
    const task = await Task.findOne({ _id: taskID });

    if (!task) throw new Error("Task dosen't exist").message;

    const isComplete = task.status === "complete";

    if (isComplete && task.answer) this.solvedCaptcha = task.answer;
    else if (isComplete && !task.answer)
      throw new Error("Task is complete but no answer provided!").message;

    return isComplete;
  }

  private async unassignTask(taskID: string) {
    try {
      console.log("Searching for worker with the assigned task and unassigning...");
      const unassignedWorker = await Worker.findOneAndUpdate(
        { task_id: taskID },
        { task_id: null },
        { new: true }
      );

      console.log("Task unassigned: ", unassignedWorker);
    } catch (err) {
      throw err;
    }
  }

  public async updateTaskStatus({ taskID, status, answer, difficulty }: TaskUpdateArgs) {
    try {
      console.log("Updating task...");
      const updatedTask = await Task.findByIdAndUpdate(
        taskID,
        { status, answer, difficulty },
        { new: true }
      );

      console.log("Task updated: ", updatedTask);

      // Unassign the task
      await this.unassignTask(taskID);
    } catch (err) {
      throw err;
    }
  }
}
