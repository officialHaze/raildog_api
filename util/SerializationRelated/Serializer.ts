import { CheerioAPI } from "cheerio";
import * as ch from "cheerio";
import Constants from "../Constants";
import SerializerArgs from "../Interfaces/SerializerArgs";
import { SerializedAvailableTrainsData } from "../Interfaces/SerializedData";
import Indentifier from "../Identifier";

export default class Serializer {
  public async serialize(options: SerializerArgs) {
    const { serializeInto, extractedElems, ch } = options;

    switch (serializeInto) {
      case Constants.AVAILABLE_TRAINS:
        try {
          const data = await this.serializeAvailableTrains(extractedElems, ch);
          return data;
        } catch (err) {
          throw err;
        }

      default:
        throw new Error(
          "Error serializing data! Probably the parameter 'serializeInto' was not passed!"
        );
    }
  }

  private serializeAvailableTrains(
    nodes: ch.AnyNode[],
    $: CheerioAPI
  ): Promise<SerializedAvailableTrainsData> {
    const nodesLength = nodes.length;
    return new Promise((res, rej) => {
      if (nodesLength <= 0) rej(new Error("Nodes list empty, no data to extract!"));
      let serializedData: SerializedAvailableTrainsData = {
        id: Indentifier.uniqueId(),
        train_no: parseInt($(nodes[0]).text()),
        train_name: $(nodes[1]).text(),
        source_stn: $(nodes[2]).text(),
        depart_time: $(nodes[3]).text(),
        dest_stn: $(nodes[4]).text(),
        arrival_time: $(nodes[5]).text(),
        elapsed_time: $(nodes[6]).text(),
        running_days: {
          sun: $(nodes[7]).text() === "Y",
          mon: $(nodes[8]).text() === "Y",
          tue: $(nodes[9]).text() === "Y",
          wed: $(nodes[10]).text() === "Y",
          thur: $(nodes[11]).text() === "Y",
          fri: $(nodes[12]).text() === "Y",
          sat: $(nodes[13]).text() === "Y",
        },
        classes_available: $(nodes[14]).text(),
      };
      res(serializedData);
    });
  }
}
