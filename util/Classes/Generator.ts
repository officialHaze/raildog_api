import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default class Generator {
  private jwtSecretSign = process.env.SECRET_SIGN ?? "";
  private static alphabets = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];
  private static integers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor() {
    if (!this.jwtSecretSign) throw new Error("JWT Secret sign is missing in env!").message;
  }

  public static generateAPIKey(): string {
    try {
      // Generate a unique API key and return the result
      const set = [...Generator.alphabets, ...Generator.integers];
      const setLength = set.length;
      const apiKeyLength = 30; // Number of chars
      let apikey = "";
      let i = 0;
      while (i < apiKeyLength) {
        const randNum = Math.floor(Math.random() * (setLength - 1));
        console.log("Random num: ", randNum);
        const randChar = set[randNum];
        apikey += randChar.toString();
        i++;
      }
      return apikey;
    } catch (err) {
      throw err;
    }
  }

  public generateActivationLink(userId: mongoose.Types.ObjectId | string): string {
    try {
      const jwToken = this.generateToken(userId, process.env.ACTIVATION_TOKEN_EXPIRY);

      const domain = process.env.SERVER_DOMAIN;
      if (!domain) throw new Error("Domain not found in the env file!");

      const link = `${domain}/activate/${jwToken}`;
      console.log("Activation link: ", link);

      return link;
    } catch (err) {
      throw err;
    }
  }

  public generateToken(uid: mongoose.Types.ObjectId | string, expiry: string | undefined) {
    try {
      if (!expiry) throw new Error("Access token expiry time is missing!").message;

      const token = jwt.sign({ userId: uid }, this.jwtSecretSign, { expiresIn: expiry });

      return token;
    } catch (error) {
      throw error;
    }
  }
}
