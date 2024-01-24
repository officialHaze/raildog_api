import { NextFunction, Request, Response } from "express";
import Cookie from "./Cookie";
import Validator from "./Validator";
import DB from "../DatabaseRelated/Database";

export default class Middleware {
  public static async validateToken(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const cookie = req.header("cookie");
        if (!cookie) return next({ status: 401, message: "Authorization cookie is missing!" });

        const accessToken = Cookie.retrieveCookieVal(cookie, "access_token");
        if (!accessToken) return next({ status: 401, message: "Unauthorized!" });

        const decoded = Validator.tokenValidator(accessToken);
        if (!decoded) throw new Error("No decoded value found!");

        const userId = typeof decoded !== "string" ? decoded.userId : decoded;
        const user = await DB.findUserById(userId);
        if (!user) return next({ status: 400, message: "User is not registered!" });

        req.user = user;
        req.decodedUserId = userId;

        next();
      })
      .catch(next);
  }

  public static async validateActivationToken(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const { activationToken } = req.params;

        if (!activationToken) return next({ status: 401, message: "Unauthorized!" });

        const decoded = Validator.tokenValidator(activationToken);
        if (!decoded) return next({ status: 500, message: "Token cannot be decoded!" });

        const userId = typeof decoded !== "string" ? decoded.userId : decoded;

        const user = await DB.findUserById(userId);
        if (!user) return next({ status: 400, message: "User is not registered!" });

        req.user = user;
        req.decodedUserId = userId;

        next();
      })
      .catch(next);
  }

  public static validateRefreshToken(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(() => {
        const refreshToken: string = req.body.refresh_token;
        console.log("Refresh token: ", refreshToken);

        if (!refreshToken) return next({ status: 400, message: "Refresh token is missing!" });

        // Validate the refresh token
        const decoded = Validator.tokenValidator(refreshToken);
        if (!decoded) return next({ status: 400, message: "Token verification failed!" });

        req.decodedUserId = typeof decoded !== "string" ? decoded.userId : decoded;

        next();
      })
      .catch(next);
  }

  public static async validateAPIKey(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const apikey = req.query.key;
        console.log("API KEY: ", apikey);

        if (typeof apikey !== "string") throw { status: 400, message: "Invalid API key!" };

        // Search for this API key in DB
        await DB.findAPIKey(apikey);

        next();
      })
      .catch(next);
  }

  public static async isUserRegistered(req: Request, res: Response, next: NextFunction) {
    try {
      const usernameOrEmail: string = req.body.username_or_email;
      if (!usernameOrEmail) return next({ status: 400, message: "Username is missing!" });

      // Check if user has sent email
      let user: any | null = null;
      if (usernameOrEmail.includes("@")) {
        // Find user by email
        user = await DB.findUserByEmail(usernameOrEmail);
      } else user = await DB.findUserByName(usernameOrEmail); // Find user by username

      if (!user) return next({ status: 400, message: "User is not registered!" });

      req.user = user;
      req.decodedUserId = user._id;

      return next();
    } catch (err) {
      return next(err);
    }
  }

  public static isUserVerified(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const isVerified = user.is_verified;
    if (!isVerified) return next({ status: 403, message: "User is not verified!" });

    next();
  }

  public static isUserNotVerified(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const isVerified = user.is_verified;
    if (isVerified) return next({ status: 400, message: "User is already verified!" });

    next();
  }
}
