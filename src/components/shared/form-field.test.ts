import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("does not repeat guidance when the validation error is identical", () => {
    const props = {
      id: "password",
      label: "Password",
      description: "Use at least 10 characters.",
      error: "Use at least 10 characters.",
      children: createElement("input", { id: "password" }),
    };
    const markup = renderToStaticMarkup(
      createElement(FormField, props),
    );

    expect(markup.match(/Use at least 10 characters\./g)).toHaveLength(1);
    expect(markup).toContain('id="password-error"');
    expect(markup).not.toContain('id="password-description"');
  });

  it("keeps distinct descriptions and errors available by id", () => {
    const props = {
      id: "workspaceName",
      label: "Workspace name",
      description: "You can change this later.",
      error: "Enter at least 2 characters.",
      children: createElement("input", { id: "workspaceName" }),
    };
    const markup = renderToStaticMarkup(
      createElement(FormField, props),
    );

    expect(markup).toContain('id="workspaceName-description"');
    expect(markup).toContain('id="workspaceName-error"');
  });
});
