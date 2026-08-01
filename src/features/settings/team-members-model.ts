export const TEAM_ROLES = [
  {
    name: "Owner",
    access:
      "Intended to control workspace settings, team access, and all operational and financial records.",
  },
  {
    name: "Admin",
    access:
      "Intended to manage workspace settings, members, and day-to-day operating records.",
  },
  {
    name: "Manager",
    access:
      "Intended to manage inventory, listings, sales, and reporting without controlling workspace access.",
  },
  {
    name: "Staff",
    access:
      "Intended for day-to-day inventory and order work without administrative or financial settings.",
  },
  {
    name: "Accountant",
    access:
      "Intended for financial records and reporting without inventory or team administration.",
  },
] as const;

export const TEAM_MANAGEMENT_CAPABILITIES = {
  invitations: false,
  roleChanges: false,
  accessRemoval: false,
  ownershipTransfer: false,
} as const;

export const OWNER_ROLE_IS_PROTECTED = true;

export function formatLastActive(
  value: string | undefined,
  timeZone: string,
) {
  if (!value) {
    return {
      at: null,
      label: "Activity unavailable",
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      at: null,
      label: "Activity unavailable",
    };
  }

  try {
    return {
      at: value,
      label: new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }).format(date),
    };
  } catch {
    return {
      at: value,
      label: new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(date),
    };
  }
}
