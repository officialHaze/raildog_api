export default interface CaptchaOption {
  captchaCode: string;
  captchaCodeIdx: number;
}

export interface CaptchaBypassOption {
  captchaOptions: CaptchaOption[];
  sD: string;
  phpsessid: string;
  taskID: string;
}
