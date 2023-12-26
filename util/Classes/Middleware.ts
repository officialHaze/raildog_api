import { NextFunction, Request, Response } from "express";
import Cookie from "./Cookie";
import Validator from "./Validator";

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
    const secretSign = process.env.SECRET_SIGN;
    if (!secretSign) throw new Error("JWT secret signature missing in env!").message;

    const decoded = Validator.tokenValidator(accessToken, secretSign);
    if (!decoded) throw new Error("No decoded value found!");

    req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

    next();
  }

  public static validateActivationToken(req: Request, res: Response, next: NextFunction) {
    console.log(req.path);
    const splits = req.path.split("/");
    console.log("Activation token: ", splits[splits.length - 1]);
    const activationToken = splits[splits.length - 1];

    if (!activationToken) {
      res.status(401).json({ Error: "Unauthorized!" });
      return;
    }
    // Verify the access token
    const secretSign = process.env.SECRET_SIGN;
    if (!secretSign) throw new Error("JWT secret signature missing in env!").message;

    const decoded = Validator.tokenValidator(activationToken, secretSign);
    if (!decoded) throw new Error("No decoded value found!");

    req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

    next();
  }
}
