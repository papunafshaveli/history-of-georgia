describe("logger", () => {
  const originalDev = (global as Record<string, unknown>).__DEV__;

  afterEach(() => {
    (global as Record<string, unknown>).__DEV__ = originalDev;
    jest.resetModules();
  });

  it("calls console.log in dev mode", () => {
    (global as Record<string, unknown>).__DEV__ = true;
    const spy = jest.spyOn(console, "log").mockImplementation();

    const { logger } = require("@/src/helpers/logger");
    logger.log("test message");

    expect(spy).toHaveBeenCalledWith("test message");
    spy.mockRestore();
  });

  it("suppresses console.log in production", () => {
    (global as Record<string, unknown>).__DEV__ = false;
    const spy = jest.spyOn(console, "log").mockImplementation();

    const { logger } = require("@/src/helpers/logger");
    logger.log("test message");

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("calls console.error in dev mode", () => {
    (global as Record<string, unknown>).__DEV__ = true;
    const spy = jest.spyOn(console, "error").mockImplementation();

    const { logger } = require("@/src/helpers/logger");
    logger.error("error message");

    expect(spy).toHaveBeenCalledWith("error message");
    spy.mockRestore();
  });

  it("suppresses console.error in production", () => {
    (global as Record<string, unknown>).__DEV__ = false;
    const spy = jest.spyOn(console, "error").mockImplementation();

    const { logger } = require("@/src/helpers/logger");
    logger.error("error message");

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
