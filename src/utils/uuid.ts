import * as Crypto from "expo-crypto";

export const uuid = (): string => Crypto.randomUUID();
