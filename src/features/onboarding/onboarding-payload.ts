import type { OnboardingValues } from "@/lib/validation/account";
import type { Database } from "@/types/database";

type CompleteOnboardingArgs =
  Database["public"]["Functions"]["complete_onboarding"]["Args"];

export function decodeOnboardingFormData(formData: FormData) {
  const acceptedTerms = formData.get("acceptedTerms");

  return {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    primaryCategory: formData.get("primaryCategory"),
    countryCode: formData.get("countryCode"),
    defaultCurrency: formData.get("defaultCurrency"),
    sellingMarkets: formData.getAll("sellingMarkets"),
    experienceLevel: formData.get("experienceLevel"),
    sellingChannels: formData.getAll("sellingChannels"),
    locale: formData.get("locale"),
    timeZone: formData.get("timeZone"),
    acceptedTerms:
      acceptedTerms === "true"
        ? true
        : acceptedTerms === "false"
          ? false
          : acceptedTerms,
  };
}

export function toOnboardingFormData(values: OnboardingValues) {
  const formData = new FormData();

  formData.set("firstName", values.firstName);
  formData.set("lastName", values.lastName);
  formData.set("businessName", values.businessName ?? "");
  formData.set("businessType", values.businessType);
  formData.set("primaryCategory", values.primaryCategory);
  formData.set("countryCode", values.countryCode);
  formData.set("defaultCurrency", values.defaultCurrency);
  values.sellingMarkets.forEach((market) =>
    formData.append("sellingMarkets", market),
  );
  formData.set("experienceLevel", values.experienceLevel);
  values.sellingChannels.forEach((channel) =>
    formData.append("sellingChannels", channel),
  );
  formData.set("locale", values.locale);
  formData.set("timeZone", values.timeZone);
  formData.set("acceptedTerms", String(values.acceptedTerms));

  return formData;
}

export function buildCompleteOnboardingArgs(
  values: OnboardingValues,
): CompleteOnboardingArgs {
  return {
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_business_name: values.businessName,
    p_business_type: values.businessType,
    p_primary_category: values.primaryCategory,
    p_country_code: values.countryCode,
    p_default_currency: values.defaultCurrency,
    p_selling_markets: values.sellingMarkets,
    p_experience_level: values.experienceLevel,
    p_selling_channels: values.sellingChannels,
    // The validated form can reach this builder only after exact consent.
    // Keeping the RPC contract literal prevents ordinary booleans from being
    // treated as proof of agreement by future callers.
    p_accepted_terms: true,
    p_locale: values.locale,
    p_time_zone: values.timeZone,
  };
}
