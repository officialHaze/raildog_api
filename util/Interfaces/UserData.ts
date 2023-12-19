export default interface UserData {
  email: string;
  username: string;
  phone: number;
  role: string;
  is_verified: boolean;
  verification_code?: number;
  business_name?: string;
}
