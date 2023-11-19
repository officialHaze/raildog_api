import { CaptchaBypassOption } from "./util/Interfaces/CaptchaOptions";
import AntiCaptcha from "./util/ScrappingRelated/AntiCaptcha";
import Scrapper from "./util/ScrappingRelated/Scrapper";
import express, { Request, Response } from "express";

class Main {
  private static server = express();
  private static PORT = 5050;
  public static main(args?: string[]): void {
    this.server.use(express.urlencoded({ extended: true }));
    this.server.use(express.json());

    this.server.listen(this.PORT, () => {
      console.log(`Server running on port: ${this.PORT}`);
    });

    this.server.get("/get_live_status", this.scrap);
    this.server.post("/bypass_captcha", this.bypassCaptcha);
  }

  private static async bypassCaptcha(req: Request, res: Response) {
    try {
      const body: CaptchaBypassOption = req.body;
      console.log(body);

      const anticaptcha = new AntiCaptcha();
      await anticaptcha.bypassCaptcha(body);

      res.status(200).json({ message: "success!" });
    } catch (error) {
      res.status(500).json({ Error: error });
    }
  }

  private static async scrap(req: Request, res: Response) {
    try {
      const scrapper = new Scrapper();
      const method = 1;

      const [sD, phpsessid] = await scrapper.scrapTrainLSP({ method: method });

      await scrapper.closeBrowser();

      res.status(200).json({ message: { sD, phpsessid } });
    } catch (err) {
      // Handle err
      res.status(500).json({ Error: err });
    }
  }
}

Main.main();
