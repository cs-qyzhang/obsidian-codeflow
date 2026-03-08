export type CodeflowNodeKind =
  | "bullet-call"
  | "comment"
  | "branch"
  | "loop"
  | "statement";

export type CodeflowTokenType =
  | "bullet"
  | "keyword"
  | "path"
  | "scope"
  | "function"
  | "strong"
  | "emphasis"
  | "highlight"
  | "strikethrough"
  | "comment"
  | "text";

export interface CodeflowToken {
  type: CodeflowTokenType;
  value: string;
}

export interface CodeflowNode {
  indent: number;
  raw: string;
  content: string;
  kind: CodeflowNodeKind;
  tokens: CodeflowToken[];
  children: CodeflowNode[];
}

interface InlineMarkdownMatch {
  length: number;
  type: Extract<CodeflowTokenType, "strong" | "emphasis" | "highlight" | "strikethrough">;
  value: string;
}

const KEYWORDS = ["if", "elif", "else", "for", "in", "while"];
const KEYWORD_PATTERN = /^(if|elif|else|for|in|while)\b/;
const PATH_PATTERN = /^(?:(?:[A-Za-z0-9_.-]+\/)+(?:[A-Za-z0-9_.-]+)|(?:[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+)(?=::))/;
const IDENTIFIER_PATTERN = /^[A-Za-z_][\w.]*/;

export function parseCodeflow(source: string): CodeflowNode[] {
  const roots: CodeflowNode[] = [];
  const stack: CodeflowNode[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) {
      continue;
    }

    const indent = getIndent(rawLine);
    const trimmed = rawLine.trimStart();
    const kind = detectNodeKind(trimmed);
    const content = kind === "bullet-call" ? trimmed.slice(2) : trimmed;

    const node: CodeflowNode = {
      indent,
      raw: trimmed,
      content,
      kind,
      tokens: tokenizeCodeflowLine(trimmed),
      children: []
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack.push(node);
  }

  return roots;
}

export function tokenizeCodeflowLine(line: string): CodeflowToken[] {
  const tokens: CodeflowToken[] = [];
  const commentIndex = findCommentStart(line);
  const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : "";

  let index = 0;
  while (index < codePart.length) {
    const rest = codePart.slice(index);

    if (rest.startsWith("- ")) {
      tokens.push({ type: "bullet", value: "- " });
      index += 2;
      continue;
    }

    const inlineMarkdownMatch = matchInlineMarkdown(codePart, index);
    if (inlineMarkdownMatch) {
      tokens.push({ type: inlineMarkdownMatch.type, value: inlineMarkdownMatch.value });
      index += inlineMarkdownMatch.length;
      continue;
    }

    const keywordMatch = rest.match(KEYWORD_PATTERN);
    if (keywordMatch && isBoundary(rest, keywordMatch[0].length) && isKeywordStart(codePart, index)) {
      tokens.push({ type: "keyword", value: keywordMatch[0] });
      index += keywordMatch[0].length;
      continue;
    }

    const pathMatch = rest.match(PATH_PATTERN);
    if (pathMatch) {
      tokens.push({ type: "path", value: pathMatch[0] });
      index += pathMatch[0].length;
      continue;
    }

    if (rest.startsWith("::")) {
      tokens.push({ type: "scope", value: "::" });
      index += 2;
      continue;
    }

    const identifierMatch = rest.match(IDENTIFIER_PATTERN);
    if (identifierMatch) {
      const identifier = identifierMatch[0];
      const nextChar = rest.charAt(identifier.length);
      if (nextChar === "(") {
        tokens.push({ type: "function", value: identifier });
        index += identifier.length;
        continue;
      }
    }

    tokens.push({ type: "text", value: rest.charAt(0) });
    index += 1;
  }

  if (commentPart) {
    tokens.push({ type: "comment", value: commentPart });
  }

  return mergeTextTokens(tokens);
}

export function detectNodeKind(trimmedLine: string): CodeflowNodeKind {
  if (trimmedLine.startsWith("#")) {
    return "comment";
  }

  if (trimmedLine.startsWith("- ")) {
    return "bullet-call";
  }

  if (/^(if|elif)\b/.test(trimmedLine) || trimmedLine === "else") {
    return "branch";
  }

  if (/^(for|while)\b/.test(trimmedLine)) {
    return "loop";
  }

  return "statement";
}

function getIndent(line: string): number {
  let spaces = 0;
  for (const char of line) {
    if (char === " ") {
      spaces += 1;
    } else if (char === "\t") {
      spaces += 2;
    } else {
      break;
    }
  }

  return spaces;
}

function findCommentStart(line: string): number {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] !== "#") {
      continue;
    }

    if (index === 0 || /\s/.test(line[index - 1])) {
      return index;
    }
  }

  return -1;
}

export function isCommentBoundary(line: string, index: number): boolean {
  return index === 0 || /\s/.test(line[index - 1]);
}

function matchInlineMarkdown(line: string, index: number): InlineMarkdownMatch | null {
  const input = line.slice(index);
  const previousChar = index > 0 ? line.charAt(index - 1) : "";

  const patterns: Array<{
    regex: RegExp;
    type: InlineMarkdownMatch["type"];
    boundary?: "highlight";
  }> = [
    { regex: /^\*\*([^\n*](?:[\s\S]*?[^\n*])?)\*\*/, type: "strong" },
    { regex: /^==([^=\s](?:[\s\S]*?[^=\s])?)==/, type: "highlight", boundary: "highlight" },
    { regex: /^~~([^\n~](?:[\s\S]*?[^\n~])?)~~/, type: "strikethrough" },
    { regex: /^\*([^\s*](?:.*?[^\s*])?)\*/, type: "emphasis" }
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern.regex);
    if (!match) {
      continue;
    }

    if (pattern.boundary === "highlight" && !isHighlightBoundary(previousChar)) {
      continue;
    }

    return {
      length: match[0].length,
      type: pattern.type,
      value: match[1]
    };
  }

  return null;
}

function isHighlightBoundary(previousChar: string): boolean {
  if (!previousChar) {
    return true;
  }

  return /[\s([{:;,]/.test(previousChar);
}

function isKeywordStart(line: string, index: number): boolean {
  if (index === 0) {
    return true;
  }

  return !/[A-Za-z0-9_./]/.test(line.charAt(index - 1));
}

function isBoundary(input: string, length: number): boolean {
  if (length >= input.length) {
    return true;
  }

  return !/[A-Za-z0-9_]/.test(input.charAt(length));
}

function mergeTextTokens(tokens: CodeflowToken[]): CodeflowToken[] {
  const merged: CodeflowToken[] = [];

  for (const token of tokens) {
    const previous = merged[merged.length - 1];
    if (previous && previous.type === "text" && token.type === "text") {
      previous.value += token.value;
      continue;
    }

    merged.push({ ...token });
  }

  return merged;
}

export const CODEFLOW_KEYWORDS = KEYWORDS;
