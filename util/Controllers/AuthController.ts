import { NextFunction, Request, Response } from "express";
import UserData from "../Interfaces/UserData";
import Validator from "../Classes/Validator";
import User from "../DatabaseRelated/Models/User";
import DB from "../DatabaseRelated/Database";
import Mailer from "../Classes/Mailer";
import activateAccountTemplateJson from "../Json/emailTemplates.json";
import Generator from "../Classes/Generator";
import Hasher from "../Classes/Hasher";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import LoginData from "../Interfaces/LoginData";
import Cookie from "../Classes/Cookie";
import express from "express";

export default class AuthController {
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
      const generate = new Generator();
      const link = generate.generateActivationLink(savedUser._id);

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
  public static async activateAccount(req: Request, res: Response) {
    try {
      const uid: mongoose.Types.ObjectId = req.decodedUserId;

      const user = await DB.findUserById(uid);
      if (!user) {
        res.status(400).json({ Error: "User is not registered!" });
        return;
      }

      const isVerified = user.is_verified;
      if (isVerified) {
        res.status(400).json({ Error: "User is already verified!" });
        return;
      }

      await DB.verifyUser(uid);

      res.status(200).json({ message: "User verified!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }

  // Login controller
  public static async login(req: Request, res: Response) {
    try {
      const { username, password }: LoginData = req.body;

      // Check if user exists
      const user = await DB.findUserByName(username);
      if (!user) {
        res.status(400).json({ Error: "User is not registered" });
        return;
      }

      // Check if user is verified
      const isVerified = user.is_verified;
      if (!isVerified) {
        res.status(403).json({ Error: "User is not verified!" });
        return;
      }

      // Validate the password
      const hashedPass = user.password;
      const hasher = new Hasher(process.env.SALT_ROUNDS);
      const isValidPass = await hasher.compareHash(password, hashedPass ?? "");
      if (!isValidPass) {
        res.status(403).json({ Error: "Wrong password!" });
        return;
      }

      // Create access and refresh tokens
      const generate = new Generator();
      const accessToken = generate.generateToken(user._id, process.env.ACCESS_TOKEN_EXPIRY);
      const refreshToken = generate.generateToken(user._id, process.env.REFRESH_TOKEN_EXPIRY);

      // Return access and refresh tokens
      res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }

  public static async assignAPIKey(req: Request, res: Response) {
    try {
      const uid: mongoose.Types.ObjectId = req.decodedUserId;

      // const user = await DB.findUserById(uid);
      // if (!user) {
      //   res.status(400).json({ Error: "User is not registered!" });
      //   return;
      // }

      // const isVerified = user.is_verified;
      // if (!isVerified) {
      //   res.status(403).json({ Error: "User is not verified!" });
      //   return;
      // }

      // Generate API key
      const apiKey = Generator.generateAPIKey();
      await DB.assignAPIKey(uid, apiKey);

      res.status(201).json({ api_key: apiKey });
    } catch (error: any) {
      console.error(error);
      if (error.includes("limit reached")) {
        res.status(401).json({ Error: error });
        return;
      }
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
      const generate = new Generator();
      const link = generate.generateActivationLink("767y7678sd6c87sd687c");
      res.status(200).json({ message: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ Error: "Server error!" });
    }
  }
}
