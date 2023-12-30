import mongoose from "mongoose";

export default interface UserData {
  email: string;
  username: string;
  phone: number;
  password?: string | null;
  role: string;
  is_verified: boolean;
  verification_code?: number | null;
  business_name?: string | null;
}
