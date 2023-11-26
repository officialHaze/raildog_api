import mongoose from "mongoose";
import Logger from "../Logger";
import Worker from "../Models/Worker";

export default class DB {
  private static logger: Logger = new Logger();
  public static async connect() {
    try {
      this.logger.start();
      const mongocnctstr = process.env.MONGO_DB_URI;
      if (!mongocnctstr) throw new Error("MongoDB url not found in the env").message;
      await mongoose.connect(mongocnctstr);
      console.log("Connected to MongoDB");
      this.logger.log("Connection established with mongoDB");
      this.logger.end();
    } catch (err) {
      throw err;
    }
  }

  public async workerExists(workerEmail: string): Promise<boolean> {
    try {
      const worker = await Worker.findOne({ email: workerEmail });
      if (worker) return true;
      return false;
    } catch (err) {
      throw err;
    }
  }
}
