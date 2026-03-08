import { setIcon } from "obsidian";

import { type CodeflowNode, parseCodeflow } from "./codeflow-parser";

export function renderCodeflowBlock(source: string, container: HTMLElement): void {
  const roots = parseCodeflow(source);

  container.empty();
  container.addClass("codeflow-block");

  const tree = container.createDiv({ cls: "codeflow-tree" });
  for (const node of roots) {
    renderNode(node, tree);
  }
}

function renderNode(node: CodeflowNode, parent: HTMLElement): void {
  const nodeElement = parent.createDiv({
    cls: `codeflow-node codeflow-node-${node.kind}`
  });
  const hasChildren = node.children.length > 0;

  const row = nodeElement.createDiv({ cls: "codeflow-line-row" });
  const toggle = createToggle(row, hasChildren);
  const line = row.createDiv({ cls: "codeflow-line" });

  let trimLeadingWhitespace = false;
  for (const token of node.tokens) {
    if (token.type === "bullet") {
      trimLeadingWhitespace = true;
      continue;
    }

    const value = trimLeadingWhitespace ? token.value.replace(/^\s+/, "") : token.value;
    trimLeadingWhitespace = false;

    if (!value) {
      continue;
    }

    const span = line.createSpan({ text: value });
    span.addClass("codeflow-token");
    span.addClass(`codeflow-token-${token.type}`);
  }

  if (!hasChildren) {
    return;
  }

  const children = nodeElement.createDiv({ cls: "codeflow-children" });
  for (const child of node.children) {
    renderNode(child, children);
  }

  const setCollapsed = (collapsed: boolean): void => {
    nodeElement.toggleClass("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute("aria-label", collapsed ? "Expand node" : "Collapse node");
    toggle.setAttribute("title", collapsed ? "Expand node" : "Collapse node");
    setIcon(toggle, collapsed ? "chevron-right" : "chevron-down");
  };

  toggle.addEventListener("click", () => {
    setCollapsed(!nodeElement.hasClass("is-collapsed"));
  });

  line.addEventListener("dblclick", () => {
    setCollapsed(!nodeElement.hasClass("is-collapsed"));
  });

  setCollapsed(false);
}

function createToggle(parent: HTMLElement, enabled: boolean): HTMLButtonElement | HTMLSpanElement {
  if (!enabled) {
    return parent.createSpan({ cls: "codeflow-toggle-spacer" });
  }

  const button = parent.createEl("button", {
    cls: "codeflow-toggle",
    attr: {
      type: "button",
      "aria-expanded": "true",
      "aria-label": "Collapse node",
      title: "Collapse node"
    }
  });

  setIcon(button, "chevron-down");
  return button;
}
