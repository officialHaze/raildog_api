import { Request, Response } from "express";
import FindTrainArgs from "../Interfaces/FindTrainArgs";
import Scrapper from "../ScrappingRelated/Scrapper";
import path from "path";
import { CaptchaBypassOption } from "../Interfaces/CaptchaOptions";
import AntiCaptcha from "../ScrappingRelated/AntiCaptcha";
import LiveStatusArgs from "../Interfaces/LiveStatusArgs";

export default class APIRouteController {
  public static async findTrains(req: Request, res: Response) {
    try {
      const body: FindTrainArgs = req.body;
      console.log(body);

      const scrapper = new Scrapper();
      const jsondata = await scrapper.scrapAvailableTrains(body);
      return res.status(200).json({ message: "success!", available_trains: jsondata });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: err });
    }
  }

  public static async getCaptchaImage(req: Request, res: Response) {
    try {
      const filename: string = req.body.filename;
      const filepath: string = path.join(__dirname, `/Captchas/${filename}`);

      //Download the file
      res.status(200).download(filepath);
    } catch (err) {
      res.status(500).json({ Error: "Internal server error!" });
    }
  }

  public static async bypassCaptcha(req: Request, res: Response) {
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

  public static async getLiveStatus(req: Request, res: Response) {
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

      const [sD, phpsessid, options, captchaDataUrl, data] = await scrapper.scrapLiveStatus(
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

      if (sD && phpsessid && options && captchaDataUrl)
        res
          .status(403)
          .json({ message: { sD, phpsessid, captchaOptions: options, captchaDataUrl } });
      else if (data) res.status(200).json({ message: "success!", live_status: data });
      else res.status(400).json({ Error: "Bad request" });
    } catch (err) {
      // Handle err
      console.error(err);
      res.status(500).json({ Error: err });
    }
  }
}
