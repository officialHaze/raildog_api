import WebSocket from "ws";
import CaptchaOption, { CaptchaBypassOption } from "../Interfaces/CaptchaOptions";
import axiosInstance from "../axios.config";

export default class AntiCaptcha {
  private getCaptchaText(sD: string, sK: string) {
    function ord(string: string) {
      var str = string + "";
      var code = str.charCodeAt(0);

      if (0xd800 <= code && code <= 0xdbff) {
        var hi = code;
        if (str.length === 1) return code;
        var low = str.charCodeAt(1);
        return (hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
      }

      if (0xdc00 <= code && code <= 0xdfff) return code;
      return code;
    }

    var sR = "",
      //   sD = options.sD,
      digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._";
    sD = sD.replace(/\s/g, "");
    if (!/^[a-z0-9\.\_\s]+={0,2}$/i.test(sD) || sD.length % 4 > 0) sD = "Invalid";
    sD = sD.replace(/~/g, "");
    var cur: any,
      prev: any,
      digitNum,
      i = 0,
      result = [];
    while (i < sD.length) {
      cur = digits.indexOf(sD.charAt(i));
      digitNum = i % 4;
      switch (digitNum) {
        case 1:
          result.push(String.fromCharCode((prev << 2) | (cur >> 4)));
          break;
        case 2:
          result.push(String.fromCharCode(((prev & 0x0f) << 4) | (cur >> 2)));
          break;
        case 3:
          result.push(String.fromCharCode(((prev & 3) << 6) | cur));
          break;
      }
      prev = cur;
      i++;
    }
    sD = result.join("");
    var i = 0;
    //   sK = "13";
    for (i = 0; i < sD.length; i++) {
      var sChar: string | number = sD.substr(i, 1);
      var sKChar = sK.substr((i % sK.length) - 1, 1);
      sChar = Math.floor(ord(sChar) - ord(sKChar));
      sChar = String.fromCharCode(sChar);
      sR = sR + sChar;
    }
    console.log(sR);
    return sR;
  }

  private solveCaptcha(taskID: string): Promise<string> {
    return new Promise((res, rej) => {
      try {
        // Get the captcha solve task response
        const socket = new WebSocket(`ws://localhost:5050/${taskID}`);

        socket.addEventListener("open", socket => {
          console.log("Connected with WSS");
        });

        socket.addEventListener("message", async msgEvt => {
          const captchaCode = msgEvt.data.toString("utf-8");
          console.log("Solved captcha: ", captchaCode);
          res(captchaCode);
        });

        socket.addEventListener("close", () => {
          console.log("WS Server closed the connection!");
        });
      } catch (err) {
        rej(err);
      }
    });
  }

  public async bypassCaptcha({ captchaOptions, sD, phpsessid, taskID }: CaptchaBypassOption) {
    try {
      let captchaCode: string = await this.solveCaptcha(taskID);

      const correctOption: CaptchaOption = captchaOptions.filter((option, idx) => {
        return option.captchaCode === captchaCode;
      })[0];
      console.log(correctOption, sD, phpsessid);
      const sR = this.getCaptchaText(sD, correctOption.captchaCodeIdx.toString());

      // Submit the captcha
      console.log("Submitting captcha...");
      const res = await axiosInstance.post(
        "/ajax.php?q=captcha&v=3.4.9",
        {
          "captcha-code": captchaCode,
          reqID: 1,
          reqCount: 1,
          "captcha-text": sR,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: phpsessid,
          },
        }
      );
      console.log("Response after submitting the captcha: ");
      console.log(res.status, res.data);

      return res.status;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
