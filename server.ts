import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import DB from "./util/DatabaseRelated/Database";
import AuthController from "./util/Controllers/AuthController";
import Middleware from "./util/Classes/Middleware";
import Handler from "./util/Classes/Handler";
import mongoose from "mongoose";
import APIRouteController from "./util/Controllers/APIRouteController";
import UserData from "./util/Interfaces/UserData";
import cors from "cors";

declare global {
  namespace Express {
    interface Request {
      decodedUserId: mongoose.Types.ObjectId;
      user: UserData;
    }
  }
}

class RailDog {
  private static app = express();
  private static PORT = 5050;

  public static main(args?: string[]): void {
    dotenv.config();

    const corsOptions = {
      origin: "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    };

    const globalCorsOptions = {
      origin: (origin: any, cb: any) => {
        cb(null, true);
      },
      credentials: true,
      methods: ["GET", "POST"],
    };

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.app.listen(this.PORT, async () => {
      try {
        console.log(`Server running on port: ${this.PORT}`);
        // Connect to mongoDB
        const db = new DB();
        await db.connect();
      } catch (err) {
        console.error(err);
      }
    });

    // Auth related routes
    this.app.use("/register", cors(corsOptions));
    this.app.post("/register", AuthController.userRegistration);

    this.app.use("/login", cors(corsOptions), [
      Middleware.isUserRegistered,
      Middleware.isUserVerified,
    ]);
    this.app.post("/login", AuthController.login);

    this.app.use("/send_verification_email", cors(corsOptions), [
      Middleware.isUserRegistered,
      Middleware.isUserNotVerified,
    ]);
    this.app.post("/send_verification_email", AuthController.sendVerificationEmail);

    // Train status API related routes that require API key validation
    this.app.use("/api/", cors(globalCorsOptions));
    this.app.use("/api/*", Middleware.validateAPIKey);
    this.app.post("/api/get_trains", APIRouteController.findTrains);
    this.app.post("/api/get_live_status", APIRouteController.getLiveStatus);
    this.app.post("/api/bypass_captcha", APIRouteController.bypassCaptcha);
    this.app.post("/api/get_captcha_image", APIRouteController.getCaptchaImage);

    // Refresh token route with middleware
    this.app.use("/refresh_token", cors(corsOptions), Middleware.validateRefreshToken);
    this.app.post("/refresh_token", AuthController.tokenRefresh);
    this.app.use("/refresh_token", Handler.handleTokenVerificationError);

    // Activation token middleware with account activation route
    this.app.use("/activate/:activationToken", cors(), [
      Middleware.validateActivationToken,
      Middleware.isUserNotVerified,
    ]);
    this.app.get("/activate/:activationToken", AuthController.activateAccount);
    this.app.use("/activate/:activationToken", Handler.handleTokenVerificationError);

    // Routes with token verification middleware
    this.app.use("/auth/*", cors(corsOptions), Middleware.validateToken);
    this.app.get("/auth/generate_api_key", AuthController.assignAPIKey);
    this.app.get("/auth/get_api_keys", AuthController.getAPIKeys);
    this.app.put("/auth/update_api_keys", AuthController.updateAPIKeys);
    this.app.delete("/auth/delete_api_keys", AuthController.delAPIKeys);

    this.app.use("/auth/*", Handler.handleTokenVerificationError);

    // TEST ROUTES
    this.app.get("/test-mail", AuthController.testMail);
    this.app.get("/test-generate-activate-link", AuthController.testGenerateActivationLink);

    this.app.use(Handler.handleAppError);
  }
}

RailDog.main();
