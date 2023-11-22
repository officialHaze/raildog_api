export interface SerializedAvailableTrainsData {
  id: string;
  train_no: number;
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
