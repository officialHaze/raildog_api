import { CheerioAPI } from "cheerio";
import * as ch from "cheerio";
import Constants from "../Constants";
import SerializerArgs from "../Interfaces/SerializerArgs";
import { SerializedAvailableTrainsData, SerializedLiveStatus } from "../Interfaces/SerializedData";
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

  public serializeLiveStatus(options: SerializerArgs): Promise<SerializedLiveStatus> {
    const nodes = options.extractedElems;
    const $ = options.ch;
    const nodeslength = nodes.length;
    return new Promise((res, rej) => {
      if (nodeslength <= 0) rej(new Error("Node list empty, no data to extract!"));

      // Get station name
      const nodeHTM = $(nodes[5]).html();
      const div = $(`${nodeHTM} > div`);
      const stnName = !$(div[1]).text().includes("No Halt Stations")
        ? $(div[1]).text()
        : $(div[3]).text();

      // Check if at current station
      const statusHTM = $(nodes[3]).html();
      const vTrainDiv = $(`${statusHTM} > div`);
      const atCurrentStn = $(vTrainDiv[0]).children().attr("class") === "vtrain";

      // Get platform no
      const concattedStr = !$(div[1]).text().includes("No Halt Stations")
        ? $(div[3]).text()
        : $(div[5]).text();
      const splits = concattedStr.includes(":") ? concattedStr.split(":") : [];
      const platform = splits[splits.length - 1] ?? null;

      // Get distance from source
      const distanceSplits = concattedStr.includes("kms") ? concattedStr.split("kms") : [];
      const distanceInKm = distanceSplits[0].replace(/ /g, ""); // In KMs

      // Check if wifi is available
      const wifiHTM = !$(div[1]).text().includes("No Halt Stations")
        ? $(div[3]).html()
        : $(div[5]).html();
      const innerSmallElem = $(`${wifiHTM} > small > span`);
      const innerChildren = $(innerSmallElem[0]).children().get();
      const wifiSpan = $(innerChildren[1]);
      const isWifiAvailable = wifiSpan.attr("class")?.includes("wifiCont") ?? false;

      // Get arrival time
      const timeHTM = $(nodes[9]).html();
      const timeDivs = $(`${timeHTM} > div`);
      const arrivalTime = !$(timeDivs[0]).text().includes("> div") ? $(timeDivs[0]).text() : "--";

      // Get deptr time
      const deprtTime = !$(timeDivs[1]).text().includes("> div") ? $(timeDivs[1]).text() : "--";

      let serializedData: SerializedLiveStatus = {
        id: Indentifier.uniqueId(),
        station_name: stnName,
        at_this_stn: atCurrentStn,
        is_no_halt_stn: false,
        deprt_time: deprtTime, // (24 hrs format),
        arrival_time: arrivalTime, // (24 hrs format),
        platform_no: platform ? +platform : null,
        distance_from_src_km: distanceInKm,
        is_wifi_available: isWifiAvailable,
      };

      res(serializedData);
    });
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
