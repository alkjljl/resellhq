import {
  Clock3,
  LockKeyhole,
  MailPlus,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { SettingsPanel } from "@/components/layout/settings-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  OWNER_ROLE_IS_PROTECTED,
  TEAM_MANAGEMENT_CAPABILITIES,
  TEAM_ROLES,
} from "./team-members-model";

type CurrentMember = {
  displayName: string;
  email: string;
  status: string;
  lastActiveAt: string | null;
  lastActiveLabel: string;
};

export function TeamMembersSettings({
  workspaceName,
  member,
}: {
  workspaceName: string;
  member: CurrentMember;
}) {
  return (
    <div className="space-y-6">
      <Alert tone="info">
        <div>
          <p className="font-semibold text-[var(--ink)]">
            You are the only member of this workspace
          </p>
          <p className="mt-1">
            Team invitations and role management are not available yet. Your
            workspace remains private to your current account.
          </p>
        </div>
      </Alert>

      <SettingsPanel
        title="Current workspace members"
        description={`People with access to ${workspaceName}. Only your existing owner membership is shown.`}
      >
        <article className="rounded-lg border border-[var(--line)]">
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(120px,.55fr)_minmax(160px,.75fr)] lg:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <UserRound className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {member.displayName}
                </h3>
                <p className="mt-0.5 truncate text-sm text-[var(--ink-muted)]">
                  {member.email}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ink-faint)]">
                Role
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldCheck
                  className="size-4 text-[var(--accent)]"
                  aria-hidden="true"
                />
                Owner
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ink-faint)]">
                  Account status
                </p>
                <p className="mt-1 text-sm font-medium">{member.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ink-faint)]">
                  Last active
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {member.lastActiveAt ? (
                    <time dateTime={member.lastActiveAt}>
                      {member.lastActiveLabel}
                    </time>
                  ) : (
                    member.lastActiveLabel
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p
              id="owner-protection"
              className="flex items-start gap-2 text-xs leading-5 text-[var(--ink-muted)]"
            >
              <LockKeyhole
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              The Owner role cannot be changed or removed from this workspace.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  OWNER_ROLE_IS_PROTECTED ||
                  !TEAM_MANAGEMENT_CAPABILITIES.roleChanges
                }
                aria-describedby="owner-protection"
                title="The workspace Owner role is locked."
              >
                Change role
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={
                  OWNER_ROLE_IS_PROTECTED ||
                  !TEAM_MANAGEMENT_CAPABILITIES.accessRemoval
                }
                aria-describedby="owner-protection"
                title="The workspace Owner cannot be removed."
              >
                Remove access
              </Button>
            </div>
          </div>
        </article>
      </SettingsPanel>

      <SettingsPanel
        title="Pending invitations"
        description="Invitations will appear here after team invitation functionality is implemented."
      >
        <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-dashed border-[var(--line-strong)] p-5 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--surface-subtle)] text-[var(--ink-muted)]">
              <MailPlus className="size-[18px]" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">No pending invitations</h3>
              <p
                id="invitations-unavailable"
                className="mt-1 text-sm leading-6 text-[var(--ink-muted)]"
              >
                Invite delivery and acceptance are not available yet.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            disabled={!TEAM_MANAGEMENT_CAPABILITIES.invitations}
            aria-describedby="invitations-unavailable"
            title="Team invitations are not available yet."
          >
            <MailPlus className="size-4" aria-hidden="true" />
            Invite member
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Role access guide"
        description="Reference for the planned access model. Role assignment and permission enforcement are not available yet."
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          {TEAM_ROLES.map((role) => (
            <article
              key={role.name}
              className="bg-[var(--surface)] p-4 sm:last:col-span-2"
            >
              <div className="flex items-center gap-2">
                <UsersRound
                  className="size-4 text-[var(--accent)]"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold">{role.name}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                {role.access}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--ink-muted)]">
          Future role downgrades, ownership changes, and access removals must
          identify the affected member and require explicit confirmation before
          any permission changes are applied.
        </p>
      </SettingsPanel>
    </div>
  );
}
