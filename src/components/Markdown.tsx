import { ReactNode } from "react";

type MarkdownProps = {
  source: string;
};

let keyCounter = 0;

function getKey(prefix: string) {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={getKey("strong")}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={getKey("em")}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={getKey("code")}>{token.slice(1, -1)}</code>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function flushParagraph(paragraph: string[], elements: ReactNode[]) {
  if (paragraph.length === 0) return;
  const text = paragraph.join(" ");
  elements.push(<p key={getKey("p")}>{parseInline(text)}</p>);
  paragraph.length = 0;
}

function flushList(listItems: string[], elements: ReactNode[]) {
  if (listItems.length === 0) return;
  elements.push(
    <ul key={getKey("ul")}>
      {listItems.map((item, index) => (
        <li key={getKey(`li-${index}`)}>{parseInline(item)}</li>
      ))}
    </ul>,
  );
  listItems.length = 0;
}

function flushCode(code: string[] | null, elements: ReactNode[]) {
  if (!code || code.length === 0) return;
  elements.push(
    <pre key={getKey("pre")}>
      <code>{code.join("\n")}</code>
    </pre>,
  );
}

export default function Markdown({ source }: MarkdownProps) {
  const lines = source.split(/\r?\n/);
  const elements: ReactNode[] = [];
  const paragraph: string[] = [];
  const listItems: string[] = [];
  let codeBlock: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (codeBlock) {
      if (trimmed.trim() === "```") {
        flushCode(codeBlock, elements);
        codeBlock = null;
      } else {
        codeBlock.push(trimmed);
      }
      continue;
    }

    if (trimmed.trim() === "```") {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements);
      codeBlock = [];
      continue;
    }

    if (trimmed === "") {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements);
      const level = headingMatch[1].length;
      const HeadingTag = `h${Math.min(
        level,
        6,
      )}` as keyof JSX.IntrinsicElements;
      elements.push(
        <HeadingTag key={getKey("heading")}>
          {parseInline(headingMatch[2])}
        </HeadingTag>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph(paragraph, elements);
      listItems.push(trimmed.slice(2));
      continue;
    }

    paragraph.push(trimmed);
  }

  flushCode(codeBlock, elements);
  flushParagraph(paragraph, elements);
  flushList(listItems, elements);

  return <>{elements}</>;
}
