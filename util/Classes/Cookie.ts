export default class Cookie {
  public static retrieveCookieVal(cookie: string, cookiename: string) {
    // Rectrive a cookie
    const startIdx = cookie.indexOf(cookiename); // Position of the cookie in string
    if (startIdx > -1) {
      const cookieSplit = cookie.substring(startIdx, cookie.length + 1);

      const _cookie = cookieSplit.split("; ")[0]; // The first element is the desired cookie because the cookie string was split from the start idx of the desired cookie
      const cookieval = _cookie.split("=")[1];
      return cookieval;
    }
    return null;
  }
}
