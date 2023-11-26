import { CheerioAPI } from "cheerio";
import * as ch from "cheerio";

export default interface SerializerArgs {
  serializeInto: string;
  extractedElems: ch.AnyNode[];
  ch: CheerioAPI;
}
