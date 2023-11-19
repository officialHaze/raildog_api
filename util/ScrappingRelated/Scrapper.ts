import puppeteer from "puppeteer";
import { Browser } from "puppeteer";
import ScrapMethod from "../Interfaces/ScrapMethod";
import axiosInstance from "../axios.config";
import * as ch from "cheerio";
import { Stream } from "stream";
import fs from "fs";
import CaptchaOption, { CaptchaBypassOption } from "../Interfaces/CaptchaOptions";

export default class Scrapper {
  browser: Browser | null = null;

  private async openBrowser() {
    this.browser = await puppeteer.launch();
  }

  public async closeBrowser() {
    if (this.browser) await this.browser.close();
  }

  private async newPage() {
    if (this.browser) return this.browser.newPage();
    return null;
  }

  private extractHTMLFrmSScript(sscript: string) {
    const startIdx = sscript.indexOf("html:'");
    const endIdx = sscript.indexOf("'});function ord(string)");
    const htmlWtag = sscript.substring(startIdx, endIdx + 1);
    const htmlWOTag = htmlWtag.split("html:")[1].replace(/'/g, "");

    // console.log(htmlWOTag);
    return htmlWOTag;
  }

  private extractSDVal(htmlStr: string) {
    console.log("Extracting the value of sD");
    const startIdx = htmlStr.indexOf("sD");
    const endIdx = htmlStr.indexOf("digits");
    const sD = htmlStr
      .substring(startIdx, endIdx)
      .split("=")[1]
      .replace(/'/g, "")
      .replace(",", "")
      .replace(" ", "");

    console.log("sD: " + sD);

    return sD;
  }

  private extractCaptchaOptions($: ch.CheerioAPI) {
    console.log("Printing captcha options: ");
    const options: CaptchaOption[] = [];
    const optionBtn = $(".capblock");
    const optionBtns = optionBtn.length;
    for (let i = 0; i < optionBtns; i++) {
      const captchaCode = optionBtn[i].attribs.href.replace("#", "");
      const captchaCodeIdx = i;
      options.push({
        captchaCode,
        captchaCodeIdx,
      });
    }
    console.log(options);
    return options;
  }

  private getCaptchaImage(captchaImgLink: string, currentphpsessid: string) {
    return new Promise(async (res, rej) => {
      try {
        const { data } = await axiosInstance.get(captchaImgLink, {
          responseType: "stream",
          headers: {
            Cookie: currentphpsessid,
          },
        });
        const stream: Stream = data;
        // TODO: Need to change in prod. To use external text captcha bypass services.
        stream.on("data", data => {
          fs.writeFile("./captcha.jpg", data, err => {
            if (err) throw err;
            else {
              console.log("Captcha image saved!");
              res("");
            }
          });
        });
      } catch (err) {
        rej(err);
      }
    });
  }

  // LSP --> Live Status Page
  public async scrapTrainLSP({ method }: ScrapMethod) {
    try {
      switch (method) {
        case 0:
          await this.openBrowser();
          const page = await this.newPage();

          if (!page) throw new Error("No page open in browser!").message;

          await page.goto("https://etrain.info/train/Sdah-Bnj-Local-33813/live");
          return page.content();

        case 1:
          console.log("Pinging the etrain.info live status url...");
          const { data, request } = await axiosInstance.post(
            "/ajax.php?q=runningstatus&v=3.4.9",
            {
              train: "33813",
              atstn: "SDAH",
              date: "19-11-2023",
              reqID: 1,
              reqCount: 1,
              final: 1,
            },
            {
              headers: {
                Origin: "https://etrain.info",
                Referer: "https://etrain.info/train/Sdah-Bnj-Local-33813/live",
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          if (data.sscript) {
            console.log(data.sscript);
            console.log("Captcha verification flow identified!");
            const rawHeads: string[] = request.res.rawHeaders;
            let phpsessid: string = "";

            console.log("Extracting PHPSESSID from cookie...");
            rawHeads.forEach(string => {
              if (string.includes("PHPSESSID")) {
                phpsessid = string.split(";")[0];
              }
            });
            console.log(phpsessid);

            // Extract html from sscript string
            console.log("Extracting HTML from sscript...");
            const html = this.extractHTMLFrmSScript(data.sscript);
            const $ = ch.load(html);
            // console.log($.html());

            // Extract captcha options
            const options = this.extractCaptchaOptions($);

            // Create the captcha image url
            console.log("Getting the captcha image url...");
            const captchaImg = $(".captchaimage")["0"].attribs.src;
            const captchaLink = "https://etrain.info" + captchaImg;
            console.log(captchaLink);

            // Get the captcha image
            console.log("Getting the captcha image...");
            await this.getCaptchaImage(captchaLink, phpsessid);

            // Extract the value of sD, required to create the sR(captcha-text)
            const sD = this.extractSDVal(data.sscript);

            return [sD, phpsessid];
          }
          // parse the html and extract neccessary info
          return data;

        default:
          throw new Error("No scrap method found").message;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
