import { Request, Response } from "express";
import UserData from "../Interfaces/UserData";
import Generator from "../Generator";

export default class RouteController {
  public static userRegistration(req: Request, res: Response) {
    try {
      const userData: UserData = req.body;
      console.log("User data for registration: ", userData);
      
      // Validate the user data

      // Generate API key
      const apikey = new Generator().generateAPIKey();
      res.status(200).json({apikey});
      // structure the user data and send it to DB
    }
    catch(err) {
      console.error(err)
      res.status(500).json({Error: "server error!"});
    }
  }
}
