import { CaptchaBypassOption } from "./util/Interfaces/CaptchaOptions";
import FindTrainArgs from "./util/Interfaces/FindTrainArgs";
import AntiCaptcha from "./util/ScrappingRelated/AntiCaptcha";
import Scrapper from "./util/ScrappingRelated/Scrapper";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

class RailDog {
  private static server = express();
  private static PORT = 5050;

  public static main(args?: string[]): void {
    dotenv.config();

    this.server.use(express.urlencoded({ extended: true }));
    this.server.use(express.json());

    this.server.listen(this.PORT, () => {
      console.log(`Server running on port: ${this.PORT}`);
    });

    this.server.get("/get_live_status", this.getLiveStatus);
    this.server.post("/bypass_captcha", this.bypassCaptcha);
    this.server.post("/get_trains", this.findTrains);
  }

  private static async bypassCaptcha(req: Request, res: Response) {
    try {
      const body: CaptchaBypassOption = req.body;
      console.log(body);

      const anticaptcha = new AntiCaptcha();
      await anticaptcha.bypassCaptcha(body);

      res.status(200).json({ message: "success!", phpsessid: body.phpsessid });
    } catch (error) {
      res.status(500).json({ Error: error });
    }
  }

  private static async getLiveStatus(req: Request, res: Response) {
    try {
      const phpsessid_: any = req.headers.phpsessid ?? "";

      const scrapper = new Scrapper();
      const method = 1; // Use legacy request ping technique with axios

      const [sD, phpsessid, options, data] = await scrapper.scrapLiveStatus({
        method: method,
        phpsessid: phpsessid_,
      });

      await scrapper.closeBrowser(); // Only plausible when method is 0

      if (sD && phpsessid && options) res.status(403).json({ message: { sD, phpsessid, options } });
      else if (data) res.status(200).send(data);
    } catch (err) {
      // Handle err
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
