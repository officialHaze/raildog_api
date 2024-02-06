import { NextFunction, Request, Response } from "express";
import UserData from "../Interfaces/UserData";
import Validator from "../Classes/Validator";
import User from "../DatabaseRelated/Models/User";
import DB from "../DatabaseRelated/Database";
import Mailer from "../Classes/Mailer";
import Generator from "../Classes/Generator";
import Hasher from "../Classes/Hasher";
import mongoose from "mongoose";
import APIKey from "../DatabaseRelated/Models/APIKey";
import { Worker } from "worker_threads";
import path from "path";

export default class AuthController {
  public static async userRegistration(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const userData: UserData = req.body;
        console.log("User data for registration: ", userData);

        // Check if user already exists
        const user = await User.findOne({ email: userData.email });
        if (user) return next({ status: 400, message: "User is already registered!" });

        // Validate the user data
        const isValidEmail = Validator.validateEmail(userData.email);
        console.log("Email is valid? ", isValidEmail);

        const isValidPhone = Validator.validatePhone(userData.phone);
        console.log("Is valid phone number? ", isValidPhone);

        if (!isValidEmail) return next({ status: 400, message: "Invalid email!" });

        if (!isValidPhone) return next({ status: 400, message: "Invalid phone number!" });

        if (!userData.role) return next({ status: 400, message: "No role provided!" });

        if (!userData.password) return next({ status: 400, message: "Provide a strong password!" });

        if (userData.username.length > 20)
          return next({ status: 400, message: "Username maximum length exceeded!" });

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

        // Send verification mail
        const mailer = new Mailer();
        await mailer.sendVerificationMail(savedUser._id, userData.email);

        res.status(201).json({ message: "User created and verification email sent!" });
      })
      .catch(next);
  }

  // Account activation
  public static activateAccount(req: Request, res: Response, next: NextFunction) {
    const uid: mongoose.Types.ObjectId = req.decodedUserId;

    DB.verifyUser(uid)
      .then(() => res.status(200).json({ message: "User verified!" }))
      .catch(next);
  }

  // Login controller
  public static async login(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        // const { username, password }: LoginData = req.body;
        const password: string = req.body.password;
        const user = req.user;
        const uid = req.decodedUserId;

        // Validate the password
        const hashedPass = user.password;
        const hasher = new Hasher(process.env.SALT_ROUNDS);
        const isValidPass = await hasher.compareHash(password, hashedPass ?? "");
        if (!isValidPass) return next({ status: 400, message: "Wrong password!" });

        // Create access and refresh tokens
        const generate = new Generator();
        const accessToken = generate.generateToken(uid, process.env.ACCESS_TOKEN_EXPIRY);
        const refreshToken = generate.generateToken(uid, process.env.REFRESH_TOKEN_EXPIRY);

        // Return access and refresh tokens
        return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken });
      })
      .catch(next);
  }

  public static assignAPIKey(req: Request, res: Response, next: NextFunction) {
    const uid: mongoose.Types.ObjectId = req.decodedUserId;

    // Generate API key
    const apiKey = Generator.generateAPIKey();
    DB.assignAPIKey(uid, apiKey)
      .then(({ _id, api_key, is_enabled }) => res.status(201).json({ _id, api_key, is_enabled }))
      .catch(next);
  }

  public static async getAPIKeys(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const uid: mongoose.Types.ObjectId = req.decodedUserId;
        const apikeys = await APIKey.find({ user_id: uid }, { api_key: true, is_enabled: true });
        res.status(200).json({ message: "success!", api_keys: apikeys });
      })
      .catch(next);
  }

  public static async delAPIKeys(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const apikeysToDel: mongoose.Types.ObjectId[] = req.body.api_key_ids;

        const delPromises = apikeysToDel.map(id => {
          return new Promise((res, rej) => {
            APIKey.findByIdAndDelete(id)
              .then(() => res(""))
              .catch(err => rej(err));
          });
        });

        Promise.all(delPromises)
          .then(() => res.status(200).json({ message: "success!" }))
          .catch(next);
      })
      .catch(next);
  }

  public static async updateAPIKeys(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const apikeysToUpdate: mongoose.Types.ObjectId[] = req.body.api_key_ids;
        const updateType: string = req.body.update_type; // Two types: Disable(to disable api keys), Enable(to enable api keys)

        switch (updateType) {
          case "disable":
            const dpromises = apikeysToUpdate.map(id => {
              return new Promise((res, rej) => {
                APIKey.findByIdAndUpdate(id, { is_enabled: false }, { new: true })
                  .then(updated => res(updated))
                  .catch(err => rej(err));
              });
            });

            Promise.all(dpromises)
              .then(updated => {
                console.log(updated);
                res.status(200).json({ message: "success!" });
              })
              .catch(next);
            break;

          case "enable":
            const epromises = apikeysToUpdate.map(id => {
              return new Promise((res, rej) => {
                APIKey.findByIdAndUpdate(id, { is_enabled: true }, { new: true })
                  .then(updated => res(updated))
                  .catch(err => rej(err));
              });
            });

            Promise.all(epromises)
              .then(updated => {
                console.log(updated);
                res.status(200).json({ message: "success!" });
              })
              .catch(next);
            break;

          default:
            next({ status: 400, message: "Update type not provided!" });
            break;
        }
      })
      .catch(next);
  }

  // Token refresh controller
  public static async tokenRefresh(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(() => {
        const userId = req.decodedUserId;

        // Create new access and refresh token
        const generate = new Generator();
        const newAccessToken: string = generate.generateToken(
          userId,
          process.env.ACCESS_TOKEN_EXPIRY
        );
        const newRefreshToken: string = generate.generateToken(
          userId,
          process.env.REFRESH_TOKEN_EXPIRY
        );

        // Send new set of tokens as response
        return res
          .status(201)
          .json({ access_token: newAccessToken, refresh_token: newRefreshToken });
      })
      .catch(next);
  }

  // Send / Resend verification email
  public static sendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    const uid = req.decodedUserId;

    // Send verification email to the user
    const mailer = new Mailer();
    mailer
      .sendVerificationMail(uid, user.email)
      .then(() => res.status(200).json({ message: "Verification Email sent!" }))
      .catch(next);
  }

  // Get user details
  public static getUserDetails(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(() => {
        const user = req.user;
        console.log("User: ", user);
        const userDetailsToSend = {
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
        res.status(200).json({ message: "Success!", user_details: userDetailsToSend });
      })
      .catch(next);
  }

  // Send verification code
  public static sendVerificationCode(req: Request, res: Response, next: NextFunction) {
    Promise.resolve()
      .then(async () => {
        const user = req.user;
        const uid = req.decodedUserId;
        console.log("Email: ", user.email);

        // Generate a verification code
        const generator = new Generator();
        const code = generator.generateVerificationCode();

        // Bind the verification code to current user
        console.log("Initial user: ", user);
        let updatedUser = await User.findByIdAndUpdate(
          uid,
          { verification_code: code },
          { new: true }
        );
        console.log("Updated user: ", updatedUser);

        // Expire the verification code after
        // a certain time by updating its value to null.
        const expireInSecs = process.env.EXPIRE_VERIFICATION_CODE_IN_SECONDS;
        // If the expiry time is not present
        // throw an error.
        if (!expireInSecs) throw new Error("Verification code expiry time not found in env file");
        DB.expireVerificationCode(uid, parseInt(expireInSecs));

        // Call the mailer class to send an email to
        // user's email with the verification code.
        const mailer = new Mailer();
        const to = user.email;
        const subject = "Verification code for resetting password";
        const html = `Verification code: ${code}`;
        await mailer.sendMail({
          to,
          html,
          subject,
        });

        // Send a 200 response once the email is dispatched.
        res.status(200).json({ message: "Success!" });
      })
      .catch(next);
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
