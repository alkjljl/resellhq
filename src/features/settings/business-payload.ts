import type { BusinessValues } from "@/lib/validation/account";
import type { Database } from "@/types/database";

type UpdateBusinessSettingsArgs =
  Database["public"]["Functions"]["update_business_settings"]["Args"];

export function buildUpdateBusinessSettingsArgs(
  values: BusinessValues,
): UpdateBusinessSettingsArgs {
  return {
    p_workspace_name: values.workspaceName,
    p_business_name: values.businessName,
    p_business_type: values.businessType,
    p_country_code: values.countryCode,
  };
}
