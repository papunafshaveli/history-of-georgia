import { cleanLegacyStats } from "./v2.0.0-clean-legacy-stats";

export const runMigrations = async (): Promise<void> => {
  await cleanLegacyStats();
};
