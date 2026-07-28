import { z } from "zod";
import {
  countryCodeSchema,
  currencyCodeSchema,
  displayNameSchema,
  localeSchema,
  timeZoneSchema,
  workspaceNameSchema,
} from "./common";

export const onboardingSchema = z.object({
  displayName: displayNameSchema,
  workspaceName: workspaceNameSchema,
  businessType: z.string().trim().max(80).optional().or(z.literal("")),
  countryCode: countryCodeSchema,
  defaultCurrency: currencyCodeSchema,
  locale: localeSchema,
  timeZone: timeZoneSchema,
});

export const profileSchema = z.object({
  displayName: displayNameSchema,
});

export const businessSchema = z.object({
  workspaceName: workspaceNameSchema,
  businessType: z.string().trim().max(80).optional().or(z.literal("")),
  countryCode: countryCodeSchema,
});

export const preferencesSchema = z.object({
  defaultCurrency: currencyCodeSchema,
  locale: localeSchema,
  timeZone: timeZoneSchema,
  themePreference: z.enum(["light", "dark", "system"]),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type BusinessValues = z.infer<typeof businessSchema>;
export type PreferencesValues = z.infer<typeof preferencesSchema>;
