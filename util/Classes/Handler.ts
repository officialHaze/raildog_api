import { NextFunction, Request, Response } from "express";
import { json } from "stream/consumers";

export default class Handler {
  public static handleTokenVerificationError(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Check the error type
    const isExpired = err.message.includes("expired");
    const isInvalid = err.message.includes("invalid");

    isExpired && res.status(400).json({ Error: "Verification token expired!" });
    isInvalid && res.status(403).json({ Error: "Token is invalid!" });
    !isExpired && !isInvalid && next(err);
  }

  public static handleAppError(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    if (res.headersSent) return next(err);
    if (err.status && err.message) {
      return res.status(err.status).json({ Error: err.message });
    }
    // Check if duplication key error in DB
    const isDuplicate = err.message.includes("duplicate");
    if (isDuplicate) {
      // Check for duplication type
      const isduplicateUsername = err.message.includes("username");
      const isDuplicatePhone = err.message.includes("phone");

      if (isduplicateUsername)
        return res.status(400).json({ Error: "This username is already taken." });
      if (isDuplicatePhone)
        return res.status(400).json({ Error: "This phone number is already taken!" });
    }
    return res.status(500).json({ Error: "Server Error!" });
  }
}
