import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/constants/international";

const countrySet = new Set<string>(COUNTRY_CODES);
const currencySet = new Set<string>(
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("currency")
    : [],
);

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(80, "Use 80 characters or fewer.");

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(100, "Use 100 characters or fewer.");

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => countrySet.has(value), "Choose a valid country.");

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Choose a valid currency.")
  .refine(
    (value) => currencySet.size === 0 || currencySet.has(value),
    "Choose a supported ISO currency.",
  );

export const localeSchema = z
  .string()
  .trim()
  .min(2, "Choose a preferred language.")
  .max(35, "Choose a valid language tag.")
  .refine((value) => {
    try {
      new Intl.Locale(value);
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid language tag.");

export const timeZoneSchema = z
  .string()
  .trim()
  .min(1, "Choose a time zone.")
  .max(100, "Choose a valid time zone.")
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid time zone.");
