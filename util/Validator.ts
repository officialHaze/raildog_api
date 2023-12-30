import RegexPatterns from "./RegexPatterns";


export default class Validator
{
  public static validateEmail(email: string): boolean {
    const emailRegex = new RegExp(RegexPatterns.EMAIL_REGEX);
    return emailRegex.test(email);
  }

  public static validatePhone(phone: number): boolean {
    const numRegex = new RegExp(RegexPatterns.NUMBER_REGEX);
    return numRegex.test(phone.toString()) && phone.toString().length === 10;
  }
}
