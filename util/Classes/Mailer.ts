import { google } from "googleapis";
import Constants from "../Constants";
import nodemailer from "nodemailer";
import activateAccountTemplateJson from "../Json/emailTemplates.json";
import Generator from "./Generator";
import mongoose from "mongoose";

export default class Mailer {
  private oauth2Client = new google.auth.OAuth2(
    process.env.G_CLIENT_ID,
    process.env.G_CLIENT_SECRET,
    process.env.G_REDIRECT_URI
  );

  constructor() {
    if (
      !process.env.G_CLIENT_ID ||
      !process.env.G_CLIENT_SECRET ||
      !process.env.G_REDIRECT_URI ||
      !process.env.G_REFRESH_TOKEN ||
      !process.env.RAILDOG_EMAIL
    )
      throw new Error("OAuth2 creds not provided!").message;
  }

  public async sendVerificationMail(uid: mongoose.Types.ObjectId | string, receiverEmail: string) {
    try {
      // Generate verification link
      const generate = new Generator();
      const link = generate.generateActivationLink(uid);

      const html = `
      <div>
        ${activateAccountTemplateJson.activateEmail}
        <a href=${link}>Activation link</a>
      </div>
     `;

      await this.sendMail({
        to: receiverEmail,
        html,
        subject: "Activate account",
      });

      return;
    } catch (error) {
      throw error;
    }
  }

  private async authorize(): Promise<string> {
    return new Promise((res, rej) => {
      try {
        this.oauth2Client.setCredentials({ refresh_token: process.env.G_REFRESH_TOKEN });
        this.oauth2Client.getAccessToken((err, token) => {
          if (err) rej(err);
          else if (token) res(token);
          else rej("Error while getting access token!");
        });
      } catch (err) {
        rej(err);
      }
    });
  }

  public async sendMail({ to, html, subject }: { to: string; html: string; subject: string }) {
    try {
      const ACCESS_TOKEN = await this.authorize();

      const transport = nodemailer.createTransport({
        service: "gmail",
        secure: false,
        auth: {
          type: "OAuth2",
          user: process.env.RAILDOG_EMAIL,
          clientId: process.env.G_CLIENT_ID,
          clientSecret: process.env.G_CLIENT_SECRET,
          refreshToken: process.env.G_REFRESH_TOKEN,
          accessToken: ACCESS_TOKEN,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });

      const info = await transport.sendMail({
        from: `"Raildog API" <${process.env.RAILDOG_EMAIL}>`,
        subject: subject,
        html: html,
        to: to,
      });

      console.log("Email dispatched!", info);
    } catch (err) {
      throw err;
    }
  }
}
