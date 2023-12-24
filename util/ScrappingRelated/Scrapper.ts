import puppeteer from "puppeteer";
import { Browser } from "puppeteer";
import axiosInstance from "../axios.config";
import * as ch from "cheerio";
import CaptchaOption, { CaptchaBypassOption } from "../Interfaces/CaptchaOptions";
import FindTrainArgs from "../Interfaces/FindTrainArgs";
import Serializer from "../SerializationRelated/Serializer";
import Constants from "../Constants";
import { SerializedAvailableTrainsData, SerializedLiveStatus } from "../Interfaces/SerializedData";
import LiveStatusArgs from "../Interfaces/LiveStatusArgs";

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
      .replace(/ /g, "");

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

  private getCaptchaImg(captchaImgLink: string, currentphpsessid: string): Promise<string> {
    return new Promise(async (res, rej) => {
      try {
        const { data }: { data: Buffer } = await axiosInstance.get(captchaImgLink, {
          responseType: "arraybuffer",
          headers: {
            Cookie: currentphpsessid,
          },
        });
        const base64 = data.toString("base64");
        const dataUrl = `data:image/jpg;base64,${base64}`;
        console.log("Base64 data url: ", dataUrl);
        res(dataUrl);
      } catch (err) {
        rej(err);
      }
    });
  }

  // Create referer URL for getting live status
  private createRefererUrl({ trainName, trainNo }: { trainName: string; trainNo: string }) {
    console.log("Creating Referer URL...");
    // Split the train name based on spaces
    const nameSplits = trainName.split(" ");
    let formattedName = "";
    nameSplits.forEach((split, i) => {
      const lowercase = split.toLowerCase();
      const updatedLwc = lowercase.replace(lowercase[0], lowercase[0].toUpperCase());
      formattedName += i === nameSplits.length - 1 ? updatedLwc : updatedLwc + "-";
    });
    console.log("Train name modified: " + formattedName);

    const base = process.env.CRAWL_BASE_URL;

    if (!base) throw new Error("No crawl base url found in the env file!").message;

    const url = `${base}/train/${formattedName}-${trainNo}/live`;
    console.log("Referal URL created --> " + url);

    return url;
  }

  // LSP --> Live Status Page
  public async scrapLiveStatus(
    method: number,
    options: LiveStatusArgs
  ): Promise<
    [
      sD: string | null,
      phpsessid: string | null,
      options: CaptchaOption[] | null,
      captchafile: string | null,
      data: any | null
    ]
  > {
    try {
      switch (method) {
        case 0:
          await this.openBrowser();
          const page = await this.newPage();

          if (!page) throw new Error("No page open in browser!").message;

          await page.goto("https://etrain.info/train/Sdah-Bnj-Local-33813/live");
          return [null, null, null, null, page.content()];

        case 1:
          console.log("Method 1 detected!");
          const refUrl = this.createRefererUrl({
            trainName: options.train_name,
            trainNo: options.train_no,
          });

          console.log("Pinging the etrain.info live status url...");
          const { data, request } = await axiosInstance.post(
            "/ajax.php?q=runningstatus&v=3.4.9",
            {
              train: options.train_no,
              atstn: options.at_stn,
              date: options.date,
              reqID: 1,
              reqCount: 1,
              final: 1,
            },
            {
              headers: {
                Origin: process.env.CRAWL_BASE_URL,
                Referer: refUrl,
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: options.phpsessid,
              },
            }
          );

          if (!data.data && data.sscript) {
            // console.log(data.sscript);
            console.log("Captcha verification triggered!");
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
            console.log("Creating the captcha image url...");
            const captchaImg = $(".captchaimage")["0"].attribs.src;
            const captchaLink = process.env.CRAWL_BASE_URL + captchaImg;
            console.log(captchaLink);

            // Get the captcha image
            console.log("Getting the captcha image...");
            const captchaDataUrl = await this.getCaptchaImg(captchaLink, phpsessid);

            // Extract the value of sD, required to create the sR(captcha-text)
            const sD = this.extractSDVal(data.sscript);

            return [sD, phpsessid, options, captchaDataUrl, null];
          }

          // parse the html and extract neccessary info if no captcha verification is triggered
          console.log("No captcha verification is triggered! Extracting html from data...");
          const html = data.data;

          if (!html) {
            const err = data.error.split(".")[0];
            throw err;
          }

          const $ = ch.load(html);

          console.log("Extracting the statuslist from HTML...");
          const statusList = $(".intStnTbl > tbody > tr");
          const statusListLength = statusList.length;

          const jsonData: SerializedLiveStatus[] = [];

          console.log("Serializing live status data...");
          // Serialize the data
          for (let i = 0; i < statusListLength; i++) {
            const children = statusList[i].children;
            // Serialize
            const serialzier = new Serializer();
            const data = await serialzier.serializeLiveStatus({
              serializeInto: Constants.LIVE_STATUS,
              extractedElems: children,
              ch: $,
            });

            // Check if no halt station
            const isNoHalt = $(statusList[i]).attr("class")?.includes("hide") ?? false;

            const updatedData: SerializedLiveStatus = {
              ...data,
              is_no_halt_stn: isNoHalt,
            };

            jsonData.push(updatedData);
          }
          console.log("Serialization complete returning serialized data!");

          return [null, null, null, null, jsonData];

        default:
          throw new Error("No scrap method found").message;
      }
    } catch (err) {
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
      console.log("Crawled data(HTML): " + html);

      // Extract the table containing train list
      const $ = ch.load(html);
      const trainlist = $(".trainlist > table > tbody > tr");
      const trainlistLength = trainlist.length;
      console.log("Train list: " + trainlist);

      const jsonData: SerializedAvailableTrainsData[] = [];

      // Serialize the data
      for (let i = 0; i < trainlistLength; i++) {
        const children = trainlist[i].children;
        // Serialize
        const serialzier = new Serializer();
        const data = await serialzier.serialize({
          serializeInto: Constants.AVAILABLE_TRAINS,
          extractedElems: children,
          ch: $,
        });
        jsonData.push(data);
      }
      console.log("JSON data: " + JSON.stringify(jsonData));

      return jsonData;
    } catch (err) {
      throw err;
    }
  }
}
