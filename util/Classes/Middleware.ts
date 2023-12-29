import { NextFunction, Request, Response } from "express";
import Cookie from "./Cookie";
import Validator from "./Validator";
import DB from "../DatabaseRelated/Database";

export default class Middleware {
  public static validateToken(req: Request, res: Response, next: NextFunction) {
    const cookie = req.header("cookie");
    if (!cookie) {
      res.status(403).json({ Error: "Authorization cookie missing!" });
      return;
    }

    const accessToken = Cookie.retrieveCookieVal(cookie, "access_token");
    if (!accessToken) {
      res.status(401).json({ Error: "Unauthorized!" });
      return;
    }
    // Verify the access token
    // const secretSign = process.env.SECRET_SIGN;
    // if (!secretSign) throw new Error("JWT secret signature missing in env!").message;

    const decoded = Validator.tokenValidator(accessToken);
    if (!decoded) throw new Error("No decoded value found!");

    req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

    next();
  }

  public static validateActivationToken(req: Request, res: Response, next: NextFunction) {
    // const splits = req.path.split("/");
    // console.log("Activation token: ", splits[splits.length - 1]);
    const { activationToken } = req.params;

    if (!activationToken) {
      res.status(401).json({ Error: "Unauthorized!" });
      return;
    }
    // Verify the access token
    // const secretSign = process.env.SECRET_SIGN;
    // if (!secretSign) throw new Error("JWT secret signature missing in env!").message;

    const decoded = Validator.tokenValidator(activationToken);
    if (!decoded) throw new Error("No decoded value found!");

    req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

    next();
  }

  public static validateRefreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken: string = req.body.refresh_token;
      console.log("Refresh token: ", refreshToken);

      if (!refreshToken) return res.status(400).json({ Error: "Refresh token is missing!" });

      // Validate the refresh token
      const decoded = Validator.tokenValidator(refreshToken);
      if (!decoded) return res.status(400).json({ Error: "Token couldn't be verified!" });

      req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

      next();
    } catch (error: any) {
      if (error.message.includes("invalid"))
        return res.status(403).json({ Error: "Invalid token!" });
      else if (error.message.includes("expired"))
        return res.status(403).json({ Error: "Token has expired!" });

      return res.status(500).json({ Error: "Server error!" });
    }
  }

  public static async validateAPIKey(req: Request, res: Response, next: NextFunction) {
    try {
      const apikey = req.query.key;
      console.log("API KEY: ", apikey);

      if (typeof apikey !== "string") throw new Error("Invalid API Key!");

      // Search for this API key in DB
      await DB.findAPIKey(apikey);

      next();
    } catch (err: any) {
      console.error("API key verify error! ", err);
      if (err.message.includes("Invalid")) {
        return res.status(403).json({ Error: err.message });
      }
      if (err.message.includes("disabled")) {
        return res.status(406).json({ Error: err.message });
      }
      return res.status(500).json({ Error: "Server Error!" });
    }
  }
}
