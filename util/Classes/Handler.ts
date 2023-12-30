import { NextFunction, Request, Response } from "express";

export default class Handler {
  public static handleTokenVerificationError(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.error("Token verification error: ", err);
    // Check the error type
    const isExpired = err.message.includes("expired");
    const isInvalid = err.message.includes("invalid");

    isExpired && res.status(400).json({ Error: "Verification token expired!" });
    isInvalid && res.status(403).json({ Error: "Token is invalid!" });
    !isExpired && !isInvalid && res.status(400).json({ Error: "Token verification error" });
  }
}
