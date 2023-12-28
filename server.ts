import express from "express";
import dotenv from "dotenv";
import DB from "./util/DatabaseRelated/Database";
import AuthController from "./util/Controllers/AuthController";
import Middleware from "./util/Classes/Middleware";
import Handler from "./util/Classes/Handler";
import mongoose from "mongoose";
import APIRouteController from "./util/Controllers/APIRouteController";

declare global {
  namespace Express {
    interface Request {
      decodedUserId: mongoose.Types.ObjectId;
    }
  }
}

class RailDog {
  private static app = express();
  private static PORT = 5050;

  public static main(args?: string[]): void {
    dotenv.config();

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
    this.app.post("/register", AuthController.userRegistration);
    this.app.post("/login", AuthController.login);

    // Train status API related routes that require API key validation
    this.app.use("/api/*", Middleware.validateAPIKey);
    this.app.post("/api/get_trains", APIRouteController.findTrains);
    this.app.post("/api/get_live_status", APIRouteController.getLiveStatus);
    this.app.post("/api/bypass_captcha", APIRouteController.bypassCaptcha);
    this.app.post("/api/get_captcha_image", APIRouteController.getCaptchaImage);

    // Activation token middleware with account activation route
    this.app.use("/activate/:activationToken", Middleware.validateActivationToken);
    this.app.use(Handler.handleTokenVerificationError);
    this.app.get("/activate/:activationToken", AuthController.activateAccount);

    // Routes with token verification middleware
    this.app.use(Middleware.validateToken);
    this.app.use(Handler.handleTokenVerificationError);
    this.app.post("/generate_api_key", AuthController.assignAPIKey);

    // TEST ROUTES
    this.app.get("/test-mail", AuthController.testMail);
    this.app.get("/test-generate-activate-link", AuthController.testGenerateActivationLink);
  }
}

RailDog.main();
