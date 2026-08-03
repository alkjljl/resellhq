import { describe, expect, it } from "vitest";
// @ts-expect-error The deployment helper is intentionally executable JavaScript.
import * as migrationParity from "../../../scripts/check-linked-migration-parity.mjs";

const { compareMigrationVersions, parseMigrationList } = migrationParity;

describe("linked migration parity", () => {
  it("parses local and remote versions without mistaking the timestamp column", () => {
    const rows = parseMigrationList(`
      Local          | Remote         | Time (UTC)
      202607250001   | 202607250001   | 202607250001
      202608020001   |                | 202608020001
                     | 202608030001   | 202608030001
    `);

    expect(rows).toEqual([
      { local: "202607250001", remote: "202607250001" },
      { local: "202608020001", remote: null },
      { local: null, remote: "202608030001" },
    ]);
  });

  it("parses the pinned CLI JSON output after progress messages", () => {
    expect(
      parseMigrationList(`Connecting to remote database...
{"migrations":[{"local":"202607310001","remote":"202607310001","time":"202607310001"},{"local":"202608020001","remote":"","time":"202608020001"}]}`),
    ).toEqual([
      { local: "202607310001", remote: "202607310001" },
      { local: "202608020001", remote: null },
    ]);
  });

  it("reports every local-only, remote-only, and unlisted migration", () => {
    expect(
      compareMigrationVersions(
        ["202607250001", "202608020001", "202608040001"],
        [
          { local: "202607250001", remote: "202607250001" },
          { local: "202608020001", remote: null },
          { local: null, remote: "202608030001" },
        ],
      ),
    ).toEqual({
      localOnly: ["202608020001", "202608040001"],
      remoteOnly: ["202608030001"],
      unlistedLocal: ["202608040001"],
    });
  });
});
