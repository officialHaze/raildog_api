export interface SerializedAvailableTrainsData {
  id: string;
  train_no: string;
  train_name: string;
  source_stn: string;
  depart_time: string;
  dest_stn: string;
  arrival_time: string;
  elapsed_time: string;
  running_days: {
    sun: boolean;
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thur: boolean;
    fri: boolean;
    sat: boolean;
  };
  classes_available: string;
}

export interface SerializedLiveStatus {
  id: string;
  station_name: string;
  at_this_stn: boolean;
  is_no_halt_stn: boolean;
  deprt_time: string; // (24 hrs format),
  arrival_time: string; // (24 hrs format),
  platform_no: number | null;
  distance_from_src_km: string;
  is_wifi_available?: boolean;
}
