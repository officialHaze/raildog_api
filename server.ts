import { CaptchaBypassOption } from "./util/Interfaces/CaptchaOptions";
import FindTrainArgs from "./util/Interfaces/FindTrainArgs";
import AntiCaptcha from "./util/ScrappingRelated/AntiCaptcha";
import Scrapper from "./util/ScrappingRelated/Scrapper";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import LiveStatusArgs from "./util/Interfaces/LiveStatusArgs";
import WebSocket, { OPEN, WebSocketServer } from "ws";
import http from "http";
import Logger from "./util/Logger";
import fs from "fs";
import path from "path";
import DB from "./util/DatabaseRelated/Database";
import RouteController from "./util/Controllers/RouteController";

class RailDog {
  private static app = express();
  private static server = http.createServer(this.app);
  private static PORT = 5050;
  private static logger = new Logger();

  public static main(args?: string[]): void {
    dotenv.config();

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.server.listen(this.PORT, async () => {
      try {
        console.log(`Server running on port: ${this.PORT}`);
        // Connect to mongoDB
        const db = new DB();
        await db.connect();
      }
      catch(err) {
        console.error(err)
      }
    });

    this.app.post("/get_live_status", this.getLiveStatus);
    this.app.post("/bypass_captcha", this.bypassCaptcha);
    this.app.post("/get_trains", this.findTrains);
    this.app.post("/get_captcha_image", this.getCaptchaImage);
    this.app.post("/register", RouteController.userRegistration);

    // //Websocket server
    // const wss = new WebSocketServer({ server: this.server });

    // this.logger.start();
    // wss.on("connection", ws => {
    //   this.logger.log("New client connection to WSS");

    //   ws.on("message", (data, isBinary) => {
    //     this.logger.log("Received: " + data.toString("utf-8"));
    //     this.logger.log("Emitting to all clients...");
    //     wss.clients.forEach(client => {
    //       if (client.readyState === OPEN) {
    //         client.send(data.toString("utf-8"));
    //         this.logger.log("Data emitted..closing connection to this client!");
    //         client.close();
    //       }
    //     });
    //     this.logger.end();
    //   });
    // });
  }

  private static async getCaptchaImage(req: Request, res: Response) {
    try {
      const filename: string = req.body.filename;
      const filepath: string = path.join(__dirname, `/Captchas/${filename}`);

      //Download the file
      res.status(200).download(filepath);
    } catch (err) {
      res.status(500).json({ Error: "Internal server error!" });
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

      const [sD, phpsessid, options, captchafilename, data] = await scrapper.scrapLiveStatus(
        method,
        {
          phpsessid: phpsessid_,
          at_stn: at_stn,
          date: date,
          train_no: train_no,
          train_name: train_name,
        }
      );

      await scrapper.closeBrowser(); // Only plausible when method is 0

      if (sD && phpsessid && options && captchafilename)
        res
          .status(403)
          .json({ message: { sD, phpsessid, captchaOptions: options, captchafilename } });
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
