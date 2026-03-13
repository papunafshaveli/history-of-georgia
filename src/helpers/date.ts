import dayjs from "dayjs";

export type DatePossibleValues = string | number | Date | dayjs.Dayjs;

export const DEFAULT_FORMAT = "ddd MMM DD YYYY";

export const getCurrentDate = () => dayjs();

export const getDate = (
  time: DatePossibleValues,
  format?: string,
  strict?: boolean,
) => dayjs(time, format, strict);

export const formatDate = (
  format: string = DEFAULT_FORMAT,
  time: DatePossibleValues = getCurrentDate(),
) => getDate(time).format(format);
