import { CaptchaBypassOption } from "./src/Interfaces/CaptchaOptions";
import FindTrainArgs from "./src/Interfaces/FindTrainArgs";
import AntiCaptcha from "./src/ScrappingRelated/AntiCaptcha";
import Scrapper from "./src/ScrappingRelated/Scrapper";
import dotenv from "dotenv";
import LiveStatusArgs from "./src/Interfaces/LiveStatusArgs";
import path from "path";

export default class RailDog {
  scrapper: any;
  anticaptcha: any;
  constructor() {
    this.scrapper = new Scrapper();
    this.anticaptcha = new AntiCaptcha();
  }
  // private static async getCaptchaImage(req: Request, res: Response) {
  //   try {
  //     const filename: string = req.body.filename;
  //     const filepath: string = path.join(__dirname, `/Captchas/${filename}`);

  //     //Download the file
  //     res.status(200).download(filepath);
  //   } catch (err) {
  //     res.status(500).json({ Error: "Internal server error!" });
  //   }
  // }

  public async bypassCaptcha(captchaResult: string) {
    try {
      // const anticaptcha = new AntiCaptcha();
      const status = await this.anticaptcha.bypassCaptcha(this.scrapper, captchaResult);

      if (status === 200) {
        return "Captcha bypassed!";
      }
      throw new Error("Captcha bypass failed!").message;
    } catch (error) {
      throw error;
    }
  }

  // Method 1 is default denoting legacy ping and scrap method using axios
  public async getLiveStatus(options_: LiveStatusArgs, method_: number = 1) {
    try {
      // const scrapper = new Scrapper();

      const [captchaImgDataUrl, data] = await this.scrapper.scrapLiveStatus(method_, options_);

      if (captchaImgDataUrl) throw { message: "Captcha triggered!", captchaImgDataUrl };
      else if (data) return data;
      else throw new Error("Something went wrong!").message;
    } catch (err) {
      // Handle err
      console.error(err);
      throw err;
    }
  }

  public async findTrains(options: FindTrainArgs) {
    try {
      console.log("Arguments: ", options);

      // const scrapper = new Scrapper();
      const jsondata = await this.scrapper.scrapAvailableTrains(options);

      console.log("Available trains: ", jsondata);

      return jsondata;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
