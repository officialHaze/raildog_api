export default class Constants {
  public static AVAILABLE_TRAINS = "AVAILABLE_TRAINS";
  public static LIVE_STATUS = "LIVE STATUS";
  public static CLIENT_ID: string = process.env.G_CLIENT_ID ?? "";
  public static CLIENT_SECRET: string = process.env.G_CLIENT_SECRET ?? "";
  public static REFRESH_TOKEN: string = process.env.G_REFRESH_TOKEN ?? "";
  public static REDIRECT_URI: string = process.env.G_REDIRECT_URI ?? "";
  public static RAILDOG_EMAIL: string = process.env.RAILDOG_EMAIL ?? "";
}
