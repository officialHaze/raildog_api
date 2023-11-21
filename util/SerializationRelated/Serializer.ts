import { CheerioAPI } from "cheerio";
import * as ch from "cheerio";
import Constants from "../Constants";
import SerializerArgs from "../Interfaces/SerializerArgs";
import { SerializedAvailableTrainsData } from "../Interfaces/SerializedData";

export default class Serializer {
  public serialize(options: SerializerArgs) {
    const { serializeInto, extractedElems, ch } = options;

    switch (serializeInto) {
      case Constants.AVAILABLE_TRAINS:
        const data = this.serializeAvailableTrains(extractedElems, ch);
        return data;
        break;

      default:
        break;
    }
  }

  private serializeAvailableTrains(nodes: ch.AnyNode[], $: CheerioAPI) {
    const nodesLength = nodes.length;
    let serializedData: SerializedAvailableTrainsData = {
      trainNum: 0,
      trainName: "",
      sourceStn: "",
      departTime: "",
      destStn: "",
      arrivalTime: "",
      elapsedTime: "",
      runningDays: {
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thur: false,
        fri: false,
        sat: false,
      },
      classAvailable: "",
    };
    nodes.forEach((node, i) => {
      switch (i) {
        case 0:
          serializedData = {
            ...serializedData,
            trainNum: parseInt($(node).text()),
          };
          break;

        default:
          break;
      }
    });
    return serializedData;
  }
}
