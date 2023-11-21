export interface SerializedAvailableTrainsData {
  trainNum: number;
  trainName: string;
  sourceStn: string;
  departTime: string;
  destStn: string;
  arrivalTime: string;
  elapsedTime: string;
  runningDays: {
    sun: boolean;
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thur: boolean;
    fri: boolean;
    sat: boolean;
  };
  classAvailable: string;
}
