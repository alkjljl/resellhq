import { z } from "zod";
import {
  BUSINESS_TYPES,
  EXPERIENCE_LEVELS,
  PRIMARY_CATEGORIES,
  SELLING_CHANNELS,
} from "@/lib/constants/international";
import {
  countryCodeSchema,
  currencyCodeSchema,
  localeSchema,
  timeZoneSchema,
  workspaceNameSchema,
} from "./common";

const personNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(80, "Use 80 characters or fewer.");

export const businessNameSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") return value;
    return value.trim() || null;
  },
  z.string().max(100, "Use 100 characters or fewer.").nullable(),
);

const requiredChoice = <T extends readonly [string, ...string[]]>(
  choices: T,
  message: string,
) =>
  z
    .union([z.enum(choices), z.literal("")])
    .transform((value, context) => {
      if (value === "") {
        context.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return value;
    });

export const onboardingSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  businessName: businessNameSchema,
  businessType: requiredChoice(BUSINESS_TYPES, "Choose a business type."),
  primaryCategory: requiredChoice(
    PRIMARY_CATEGORIES,
    "Choose a primary category.",
  ),
  countryCode: countryCodeSchema,
  defaultCurrency: currencyCodeSchema,
  sellingMarkets: z
    .array(countryCodeSchema)
    .min(1, "Choose at least one selling market."),
  experienceLevel: requiredChoice(
    EXPERIENCE_LEVELS,
    "Choose your experience level.",
  ),
  sellingChannels: z
    .array(requiredChoice(SELLING_CHANNELS, "Choose a valid selling channel."))
    .min(1, "Choose at least one selling channel."),
  locale: localeSchema,
  timeZone: timeZoneSchema,
  acceptedTerms: z
    .boolean()
    .refine((value) => value === true, "Accept the Terms and Privacy Notice."),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use 80 characters or fewer."),
});

export const businessSchema = z.object({
  workspaceName: workspaceNameSchema,
  businessName: businessNameSchema,
  businessType: requiredChoice(BUSINESS_TYPES, "Choose a business type."),
  countryCode: countryCodeSchema,
});

export const preferencesSchema = z.object({
  defaultCurrency: currencyCodeSchema,
  locale: localeSchema,
  timeZone: timeZoneSchema,
  themePreference: z.enum(["light", "dark", "system"]),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type OnboardingInput = z.input<typeof onboardingSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type BusinessValues = z.infer<typeof businessSchema>;
export type BusinessInput = z.input<typeof businessSchema>;
export type PreferencesValues = z.infer<typeof preferencesSchema>;
