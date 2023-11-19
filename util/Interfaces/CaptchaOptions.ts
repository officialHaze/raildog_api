export default interface CaptchaOption {
  captchaCode: string;
  captchaCodeIdx: number;
}

export interface CaptchaBypassOption {
  captchaCode: string;
  captchaOptions: CaptchaOption[];
  sD: string;
}
