import Scrapper from "./util/ScrappingRelated/Scrapper";

class Main {
  public static main(args?: string[]): void {
    this.scrap();
  }

  private static async scrap() {
    try {
      const scrapper = new Scrapper();
      const method = 1;

      const sD = await scrapper.scrapTrainLSP({ method: method });

      await scrapper.closeBrowser();
    } catch (err) {
      // Handle err
    }
  }
}

Main.main();
