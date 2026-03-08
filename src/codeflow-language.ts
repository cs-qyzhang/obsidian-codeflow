import type { Extension } from "@codemirror/state";
import { LanguageDescription, LanguageSupport, StreamLanguage } from "@codemirror/language";
import { markdownLanguage } from "@codemirror/lang-markdown";

import { CODEFLOW_KEYWORDS, isCommentBoundary } from "./codeflow-parser";

const keywordSet = new Set(CODEFLOW_KEYWORDS);
const PATH_PATTERN = /^(?:(?:[A-Za-z0-9_.-]+\/)+(?:[A-Za-z0-9_.-]+)|(?:[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+)(?=::))/;

const codeflowLanguage = StreamLanguage.define({
  startState() {
    return {};
  },

  token(stream) {
    if (stream.sol()) {
      stream.eatSpace();
      if (stream.match("- ")) {
        return "operator";
      }
    }

    if (matchesComment(stream)) {
      stream.skipToEnd();
      return "comment";
    }

    if (stream.match(/^\*\*([^\n*](?:[\s\S]*?[^\n*])?)\*\*/)) {
      return "strong";
    }

    if (matchesHighlight(stream)) {
      return "highlight";
    }

    if (stream.match(/^~~([^\n~](?:[\s\S]*?[^\n~])?)~~/)) {
      return "strikethrough";
    }

    if (stream.match(/^\*([^\s*](?:.*?[^\s*])?)\*/)) {
      return "emphasis";
    }

    if (matchesKeyword(stream)) {
      return "keyword";
    }

    if (stream.match(PATH_PATTERN)) {
      return "string";
    }

    if (stream.match(/^::/)) {
      return "punctuation";
    }

    if (stream.match(/^[A-Za-z_][\w.]*(?=\()/)) {
      return "function";
    }

    if (stream.match(/^[A-Za-z_][\w.]*/)) {
      const current = stream.current();
      if (keywordSet.has(current)) {
        return "keyword";
      }

      return "variableName";
    }

    stream.next();
    return null;
  }
});

export function createCodeflowEditorExtension(): Extension[] {
  const support = new LanguageSupport(codeflowLanguage);

  return [
    markdownLanguage.data.of({
      codeLanguages: [
        LanguageDescription.of({
          name: "codeflow",
          alias: ["codeflow"],
          support
        })
      ]
    })
  ];
}

function matchesHighlight(stream: {
  match: (pattern: RegExp, consume?: boolean) => boolean | RegExpMatchArray | null;
  string: string;
  pos: number;
}): boolean {
  const previousChar = stream.pos > 0 ? stream.string.charAt(stream.pos - 1) : "";
  if (previousChar && !/[\s([{:;,]/.test(previousChar)) {
    return false;
  }

  return stream.match(/^==([^=\s](?:[\s\S]*?[^=\s])?)==/) !== null;
}

function matchesKeyword(stream: {
  match: (pattern: RegExp, consume?: boolean) => boolean | RegExpMatchArray | null;
  string: string;
  pos: number;
}): boolean {
  const previousChar = stream.pos > 0 ? stream.string.charAt(stream.pos - 1) : "";
  if (previousChar && /[A-Za-z0-9_./]/.test(previousChar)) {
    return false;
  }

  return stream.match(/^(if|elif|else|for|in|while)\b/) !== null;
}

function matchesComment(stream: {
  peek: () => string | undefined;
  string: string;
  pos: number;
}): boolean {
  return stream.peek() === "#" && isCommentBoundary(stream.string, stream.pos);
}
