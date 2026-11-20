const mockCancel = jest.fn().mockResolvedValue(undefined);
const mockSchedule = jest.fn().mockResolvedValue("id");
const mockPermissions = jest.fn();
const mockReadRecord = jest.fn();

jest.mock("expo-notifications", () => ({
  cancelScheduledNotificationAsync: (...a: unknown[]) => mockCancel(...a),
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
  getPermissionsAsync: () => mockPermissions(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("@/src/services/local-daily-progress", () => ({
  readRecord: (...args: unknown[]) => mockReadRecord(...args),
}));

import { todayTbilisi } from "@/src/utils/tbilisiDate";
import { nextReminderAt, refreshDailyReminder } from "@/src/helpers/dailyReminder";

const texts = { title: "t", body: "b" };

describe("nextReminderAt", () => {
  it("today at 20:00 when not played and before 20:00", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 9, 0), false)).toEqual(
      new Date(2026, 10, 18, 20, 0),
    );
  });

  it("tomorrow at 20:00 once played", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 9, 0), true)).toEqual(
      new Date(2026, 10, 19, 20, 0),
    );
  });

  it("tomorrow at 20:00 when it is already past 20:00", () => {
    expect(nextReminderAt(new Date(2026, 10, 18, 21, 0), false)).toEqual(
      new Date(2026, 10, 19, 20, 0),
    );
  });
});

describe("refreshDailyReminder", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 18, 9));
    mockCancel.mockClear();
    mockSchedule.mockClear();
    mockReadRecord.mockReset().mockResolvedValue(null);
    mockPermissions.mockReset().mockResolvedValue({ status: "granted" });
  });

  afterEach(() => jest.useRealTimers());

  it("only cancels when reminders are off", async () => {
    await refreshDailyReminder(false, texts);
    expect(mockCancel).toHaveBeenCalledWith("daily-reminder");
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("does not schedule without permission", async () => {
    mockPermissions.mockResolvedValue({ status: "denied" });
    await refreshDailyReminder(true, texts);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("schedules one reminder under the fixed id", async () => {
    mockPermissions.mockResolvedValue({ status: "granted" });
    await refreshDailyReminder(true, texts);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "daily-reminder" }),
    );
  });

  it("checks the Tbilisi date at the local notification time", async () => {
    mockReadRecord.mockResolvedValue({ status: "done", answers: [] });
    await refreshDailyReminder(true, texts);
    expect(mockReadRecord).toHaveBeenCalledWith(todayTbilisi(new Date(2026, 10, 18, 20)));
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: { type: "date", date: new Date(2026, 10, 19, 20) },
      }),
    );
  });

  it("cancels after an in-flight schedule when reminders are turned off", async () => {
    let finishSchedule!: (id: string) => void;
    const scheduled = new Promise<void>((resolve) => {
      mockSchedule.mockImplementationOnce(() => {
        resolve();
        return new Promise<string>((finish) => { finishSchedule = finish; });
      });
    });
    const enable = refreshDailyReminder(true, texts);
    await scheduled;
    const disable = refreshDailyReminder(false, texts);
    finishSchedule("id");
    await Promise.all([enable, disable]);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(mockCancel.mock.invocationCallOrder[1]).toBeGreaterThan(
      mockSchedule.mock.invocationCallOrder[0],
    );
  });
});
