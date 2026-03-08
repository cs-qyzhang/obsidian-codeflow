import { Plugin } from "obsidian";

import { createCodeflowEditorExtension } from "./codeflow-language";
import { renderCodeflowBlock } from "./codeflow-renderer";

export default class CodeflowPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerMarkdownCodeBlockProcessor("codeflow", (source, el) => {
      renderCodeflowBlock(source, el);
    });

    this.registerEditorExtension(createCodeflowEditorExtension());
  }
}
