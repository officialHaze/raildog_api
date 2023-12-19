import { Request, Response, json } from "express";
import UserData from "../Interfaces/UserData";
import Validator from "../Validator";
import User from "../DatabaseRelated/Models/User";
import DB from "../DatabaseRelated/Database";

export default class RouteController {
  public static async userRegistration(req: Request, res: Response) {
    try {
      const userData: UserData = req.body;
      console.log("User data for registration: ", userData);
      
      // Check if user already exists
      const user = await User.findOne({email: userData.email});
      if(user) {
        res.status(400).json({Error: "User is already registered!"});
        return;
      }

      // Validate the user data
      const isValidEmail = Validator.validateEmail(userData.email);
      console.log("Email is valid? ", isValidEmail);
      
      const isValidPhone = Validator.validatePhone(userData.phone);
      console.log("Is valid phone number? ", isValidPhone);

      if(!isValidEmail) {
        res.status(400).json({Error: "Invalid email!"});
        return;
      }

      if(!isValidPhone) {
        res.status(400).json({Error: "Invalid phone number!"});
        return;
      }

      if(!userData.role) {
        res.status(400).json({Error: "No role provided!"});
        return;
      }

      if(userData.username.length > 20) {
        res.status(400).json({Error: "Username maximum length exceeded!"});
        return;
      }

      // Create the user / save in DB
      const db = new DB();
      await db.createUser(userData);

      res.status(200).json({message: "User created!"});
    }
    catch(err) {
      console.error(err)
      res.status(500).json({Error: "server error!"});
    }
  }
}
