export default interface ScrapMethod {
  method: number; // 0:use puppeteer, 1:use axios
  phpsessid: string;
}
