import puppeteer from "puppeteer";
import { Browser } from "puppeteer";
import ScrapMethod from "../Interfaces/ScrapMethod";
import axiosInstance from "../axios.config";
import * as ch from "cheerio";
import { Stream } from "stream";
import fs from "fs";
import CaptchaOption, { CaptchaBypassOption } from "../Interfaces/CaptchaOptions";
import FindTrainArgs from "../Interfaces/FindTrainArgs";
import Serializer from "../SerializationRelated/Serializer";
import Constants from "../Constants";
import { SerializedAvailableTrainsData } from "../Interfaces/SerializedData";

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
  public async scrapLiveStatus({
    method,
    phpsessid,
  }: ScrapMethod): Promise<
    [sD: string | null, phpsessid: string | null, options: CaptchaOption[] | null, data: any | null]
  > {
    try {
      switch (method) {
        case 0:
          await this.openBrowser();
          const page = await this.newPage();

          if (!page) throw new Error("No page open in browser!").message;

          await page.goto("https://etrain.info/train/Sdah-Bnj-Local-33813/live");
          return [null, null, null, page.content()];

        case 1:
          console.log("Pinging the etrain.info live status url...");
          const { data, request } = await axiosInstance.post(
            "/ajax.php?q=runningstatus&v=3.4.9",
            {
              train: "33813",
              atstn: "SDAH",
              date: "21-11-2023",
              reqID: 1,
              reqCount: 1,
              final: 1,
            },
            {
              headers: {
                Origin: "https://etrain.info",
                Referer: "https://etrain.info/train/Sdah-Bnj-Local-33813/live",
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: phpsessid,
              },
            }
          );
          console.log(data);
          if (!data.data && data.sscript) {
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

            return [sD, phpsessid, options, null];
          }
          // parse the html and extract neccessary info
          console.log(data.data);
          return [null, null, null, data.data];

        default:
          throw new Error("No scrap method found").message;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  public async scrapAvailableTrains({ startStation, stopStation, travelDate }: FindTrainArgs) {
    try {
      const param = `${startStation} to ${stopStation}`;
      const query = `date=${travelDate}`;

      const formattedParam = param.replace(/ /g, "-") + `/?${query}`;
      console.log(formattedParam);

      // const crawlBaseUrl = process.env.CRAWL_BASE_URL;
      // console.log("CRAWL BASE URL: " + crawlBaseUrl);

      // if (!crawlBaseUrl) throw new Error("Crawl url not found in env file!").message;

      const crawlUrl = `/trains/${formattedParam}`;
      console.log("URL to crawl to scrap available trains: " + crawlUrl);

      // Crawl the url
      const { data: html } = await axiosInstance.get(crawlUrl);
      console.log("Crawled data(HTML): ", html);

      // Extract the table containing train list
      const $ = ch.load(html);
      const trainlist = $(".trainlist > table > tbody > tr");
      const trainlistLength = trainlist.length;
      console.log("Train list: ", trainlist);

      const jsonData: SerializedAvailableTrainsData[] = [];

      // Serialize the data
      for (let i = 0; i < trainlistLength; i++) {
        const children = trainlist[i].children;
        // Serialize
        const serialzier = new Serializer();
        const data = serialzier.serialize({
          serializeInto: Constants.AVAILABLE_TRAINS,
          extractedElems: children,
          ch: $,
        });
        data && jsonData.push(data);
        // children.forEach(childNode => {
        //   console.log($(childNode).text());
        // });
      }
      console.log("JSON data: ", jsonData);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
