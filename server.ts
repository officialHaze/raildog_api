import { CaptchaBypassOption } from "./src/Interfaces/CaptchaOptions";
import FindTrainArgs from "./src/Interfaces/FindTrainArgs";
import AntiCaptcha from "./src/ScrappingRelated/AntiCaptcha";
import Scrapper from "./src/ScrappingRelated/Scrapper";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import LiveStatusArgs from "./src/Interfaces/LiveStatusArgs";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import Logger from "./src/Logger";
import DB from "./src/lib/Database";
import WorkerRegistration from "./src/Interfaces/WorkerRegistration";
import Worker from "./src/Models/Worker";
import CaptchaSolver from "./src/CaptchaSolvingRelated/CaptchaSolver";
import TaskUpdateArgs from "./src/Interfaces/UpdateTaskArgs";

class RailDog {
  private static app = express();
  private static server = http.createServer(this.app);
  private static PORT = 5050;
  private static logger = new Logger();

  public static main(args?: string[]): void {
    dotenv.config();

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.server.listen(this.PORT, () => {
      console.log(`Server is running on port: ${this.PORT}`);

      // Connect to DB
      try {
        console.log("Connecting to MongoDB...");
        DB.connect().catch(err => {
          throw err;
        });
      } catch (err) {
        console.error("Connection to MongoDB failed!");
        console.error(err);
      }
    });

    this.app.post("/get_live_status", this.getLiveStatus);
    this.app.post("/bypass_captcha", this.bypassCaptcha);
    this.app.post("/get_trains", this.findTrains);
    this.app.post("/register_worker", this.registerWorker);

    //Websocket server
    const wss = new WebSocketServer({ server: this.server });

    wss.on("connection", async (ws, req) => {
      try {
        console.log("New client connection to WSS");
        const urlSplits = req.url?.split("/");

        if (!urlSplits) {
          throw new Error("Expected task id in params!").message;
        }

        const taskID = urlSplits[urlSplits.length - 1];

        console.log("Task ID: ", taskID);

        // Check if task is already complete
        const captchaSolver = new CaptchaSolver();
        console.log("Checking if task is complete...");
        const isTaskComplete = await captchaSolver.isTaskComplete(taskID);

        if (isTaskComplete) {
          console.log("Task complete!");
          const solvedCaptcha = captchaSolver.solvedCaptcha;
          console.log("Solved captcha: ", solvedCaptcha);

          //Emit the solved the captcha
          console.log("Emitting the solved captcha...");
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(solvedCaptcha);
              console.log("Data emitted..closing connection to this client!");
              client.close();
            }
          });
          return;
        }

        console.log("Task is not complete...waiting for answer...");
        ws.on("message", async (data, isBinary) => {
          console.log("Answer received: ", JSON.parse(data.toString()));

          const { status, difficulty, answer }: TaskUpdateArgs = JSON.parse(data.toString());

          // Update the task status
          await captchaSolver.updateTaskStatus({
            taskID,
            status,
            difficulty,
            answer,
          });
          console.log("Emitting to all but current clients..");

          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(answer);
              console.log("Data emitted...closing connection to this client");
              client.close();
            }
          });
          ws.close();
        });
      } catch (err) {
        console.error(err);
        ws.close();
      }
    });
  }

  private static async registerWorker(req: Request, res: Response) {
    try {
      const { full_name, phone_no, email, country }: WorkerRegistration = req.body;

      // Check if worker with same email exists
      console.log("Checking if worker exists...");
      const db = new DB();
      const workerExists = await db.workerExists(email);

      if (workerExists) {
        console.log("Worker is already registered !");
        res.status(400).json({ Error: "Worker/Employee is already registered!" });
        return;
      }

      // Create / Register a new worker if worker does not exist
      console.log("Worker is not registered....creating a new worker instance...");
      const newWorker = new Worker({
        full_name,
        email,
        phone_no,
        country,
        is_online: false,
        is_available: false,
        is_verified: false,
      });

      console.log("Registering new worker...");
      await newWorker.save();

      console.log("Worker registered!!");
      res.status(201).json({ message: "Worker successfully registered!" });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ Error: "Something went wrong in the server! Please try again after sometime!" });
    }
  }

  private static async bypassCaptcha(req: Request, res: Response) {
    try {
      const body: CaptchaBypassOption = req.body;
      console.log(body);

      const anticaptcha = new AntiCaptcha();
      const status = await anticaptcha.bypassCaptcha(body);

      if (status === 200) {
        res.status(200).json({ message: "success!", phpsessid: body.phpsessid });
        return;
      }
      res.status(403).json({ message: "Please try again!" });
    } catch (error) {
      res.status(500).json({ Error: error });
    }
  }

  private static async getLiveStatus(req: Request, res: Response) {
    try {
      const {
        phpsessid: phpsessid_,
        at_stn,
        date,
        train_no,
        train_name,
      }: LiveStatusArgs = req.body;

      const scrapper = new Scrapper();
      const method = 1; // Use legacy request ping technique with axios

      const [sD, phpsessid, options, taskID, data] = await scrapper.scrapLiveStatus(method, {
        phpsessid: phpsessid_,
        at_stn: at_stn,
        date: date,
        train_no: train_no,
        train_name: train_name,
      });

      await scrapper.closeBrowser(); // Only plausible when method is 0

      if (sD && phpsessid && options && taskID)
        res.status(403).json({
          message:
            "Captcha verification is triggered...a automated captcha solving task is already created, use the taskid to get the task response",
          data: { sD, phpsessid, options, taskID },
        });
      else if (data) res.status(200).json({ message: "success!", live_status: data });
      else res.status(400).json({ Error: "Bad request" });
    } catch (err) {
      // Handle err
      console.error(err);
      res.status(500).json({ Error: err });
    }
  }

  private static async findTrains(req: Request, res: Response) {
    try {
      const body: FindTrainArgs = req.body;
      console.log(body);

      const scrapper = new Scrapper();
      const jsondata = await scrapper.scrapAvailableTrains(body);
      res.status(200).json({ message: "success!", available_trains: jsondata });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Error: err });
    }
  }
}

RailDog.main();
