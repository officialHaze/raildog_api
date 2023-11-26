import fs from "fs";
import path from "path";
import Indentifier from "./Identifier";

export default class Logger {
  private uid: string = "";
  private filepath: string = "";
  private stream: fs.WriteStream | null = null;

  constructor() {
    this.uid = Date.now().toString();
  }

  public start() {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString();
    const currentDay = new Date().getDate().toString();
    const currentDate = currentYear + currentMonth + currentDay;
    const dirpath = path.join(__dirname, `../Logs/${currentDate}`);

    // Check if current date dir exists
    const currentDateDirExists = fs.existsSync(dirpath);

    !currentDateDirExists &&
      fs.mkdir(dirpath, err => {
        if (err) throw err;
      });

    this.filepath = path.join(dirpath, `/logfile_${this.uid}.txt`);

    this.stream = fs.createWriteStream(this.filepath);
  }

  public end() {
    this.stream && this.stream.end();
  }

  public log(message: string) {
    const time = new Date().toLocaleString("en-US", { timeStyle: "short", hour12: true });
    const concatedMsg = `[${time}] ${message} \n`;

    this.stream &&
      this.stream.write(concatedMsg, err => {
        if (err) throw err;
      });
  }
}
