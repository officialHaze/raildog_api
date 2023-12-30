import { Request, Response } from "express";
import UserData from "../Interfaces/UserData";
import Validator from "../Validator";
import User from "../DatabaseRelated/Models/User";
import DB from "../DatabaseRelated/Database";
import Mailer from "../Classes/Mailer";
import activateAccountTemplateJson from "../Json/emailTemplates.json";
import Generator from "../Classes/Generator";
import Hasher from "../Classes/Hasher";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default class RouteController {
  public static async userRegistration(req: Request, res: Response) {
    try {
      const userData: UserData = req.body;
      console.log("User data for registration: ", userData);

      // Check if user already exists
      const user = await User.findOne({ email: userData.email });
      if (user) {
        res.status(400).json({ Error: "User is already registered!" });
        return;
      }

      // Validate the user data
      const isValidEmail = Validator.validateEmail(userData.email);
      console.log("Email is valid? ", isValidEmail);

      const isValidPhone = Validator.validatePhone(userData.phone);
      console.log("Is valid phone number? ", isValidPhone);

      if (!isValidEmail) {
        res.status(400).json({ Error: "Invalid email!" });
        return;
      }

      if (!isValidPhone) {
        res.status(400).json({ Error: "Invalid phone number!" });
        return;
      }

      if (!userData.role) {
        res.status(400).json({ Error: "No role provided!" });
        return;
      }

      if (!userData.password) {
        res.status(400).json({ Error: "Please provide a strong password!" });
        return;
      }

      if (userData.username.length > 20) {
        res.status(400).json({ Error: "Username maximum length exceeded!" });
        return;
      }

      // Hash the password
      const hasher = new Hasher(process.env.SALT_ROUNDS);
      const hashed = await hasher.generateHash(userData.password);

      const formattedUserData: UserData = {
        ...userData,
        password: hashed,
      }; // Updating the user data with hashed password

      // Create the user / save in DB
      const db = new DB();
      const savedUser = await db.createUser(formattedUserData);

      // Generate verification link
      const link = Generator.generateActivationLink(savedUser._id);

      // Send verification mail
      const html = `
      <div>
        ${activateAccountTemplateJson.activateEmail}
        <a href=${link}>Activation link</a>
      </div>
     `;
      const mailer = new Mailer();
      await mailer.sendMail({
        to: userData.email,
        subject: "Activate account",
        html,
      });

      res.status(201).json({ message: "User created and verification email sent!" });
    } catch (err: any) {
      console.error(err);
      if (err.message) {
        // Check if duplication key error in DB
        const isDuplicate = err.message.includes("duplicate");
        if (isDuplicate) {
          // Check for duplication type
          const isduplicateUsername = err.message.includes("username");
          const isDuplicatePhone = err.message.includes("phone");

          isduplicateUsername && res.status(400).json({ Error: "This username is already taken." });
          isDuplicatePhone &&
            res.status(400).json({ Error: "This phone number is already taken!" });

          !isDuplicatePhone &&
            !isduplicateUsername &&
            res.status(500).json({ Error: "Something went wrong try again later!" });

          return;
        }
      }
      res.status(500).json({ Error: "Server error!" });
    }
  }

  // Account activation
  public static activateAccount(req: Request, res: Response) {
    try {
      // Validate the activation token(jwt)
      const secret = process.env.SECRET_SIGN;
      if (!secret) throw new Error("Secret key to validate jwt is missing!");

      const activationToken = req.params.activationToken;
      jwt.verify(activationToken, secret, async (err, decoded) => {
        if (err) {
          console.error("JWT verification error: ", err);

          // Check the error type
          const isExpired = err.message.includes("expired");
          const isInvalid = err.message.includes("invalid");

          isExpired && res.status(400).json({ Error: "Verification token expired!" });
          isInvalid && res.status(403).json({ Error: "Token is invalid!" });
          !isExpired && !isInvalid && res.status(400).json({ Error: "Token verification error" });
          return;
        }

        if (!decoded) throw new Error("Token cannot be decoded!").message;
        console.log("Decoded: ", decoded);

        const uid: mongoose.Types.ObjectId = typeof decoded === "string" ? decoded : decoded.data;

        await DB.verifyUser(uid);

        res.status(200).json({ message: "User verified!" });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }

  // Test route for checking nodemailer
  public static async testMail(req: Request, res: Response) {
    try {
      const mailer = new Mailer();
      await mailer.sendMail({
        to: "moinak.dey8@gmail.com",
        subject: "This is a test email",
        html: "This is a test email",
      });
      res.status(200).json({ message: "Success!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }
  // Test route for checking activation link generation
  public static async testGenerateActivationLink(req: Request, res: Response) {
    try {
      const link = Generator.generateActivationLink("767y7678sd6c87sd687c");
      res.status(200).json({ message: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }
}
