import { ReactNode } from "react";

type MarkdownProps = {
  source: string;
};

type ImageBlock = {
  alt: string;
  src: string;
  title?: string;
};

let keyCounter = 0;

function getKey(prefix: string) {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

function isExternalLink(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || /^mailto:/i.test(href);
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
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
    } else if (token.startsWith("`")) {
      nodes.push(<code key={getKey("code")}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const external = isExternalLink(href);
        nodes.push(
          <a
            key={getKey("link")}
            href={href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {parseInline(label)}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("*")) {
      nodes.push(<em key={getKey("em")}>{token.slice(1, -1)}</em>);
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

function flushList(
  listItems: string[],
  elements: ReactNode[],
  ordered: boolean,
) {
  if (listItems.length === 0) return;
  const ListTag = ordered ? "ol" : "ul";
  elements.push(
    <ListTag key={getKey(ListTag)}>
      {listItems.map((item, index) => (
        <li key={getKey(`li-${index}`)}>{parseInline(item)}</li>
      ))}
    </ListTag>,
  );
  listItems.length = 0;
}

function flushBlockquote(blockquote: string[], elements: ReactNode[]) {
  if (blockquote.length === 0) return;
  elements.push(
    <blockquote key={getKey("blockquote")}>
      <p>{parseInline(blockquote.join(" "))}</p>
    </blockquote>,
  );
  blockquote.length = 0;
}

function flushCode(code: string[] | null, elements: ReactNode[]) {
  if (!code || code.length === 0) return;
  elements.push(
    <pre key={getKey("pre")}>
      <code>{code.join("\n")}</code>
    </pre>,
  );
}

function flushFigure(
  image: ImageBlock | null,
  elements: ReactNode[],
  caption?: string,
) {
  if (!image) return;
  elements.push(
    <figure key={getKey("figure")}>
      <img src={image.src} alt={image.alt} title={image.title} />
      {caption && <figcaption>{parseInline(caption)}</figcaption>}
    </figure>,
  );
}

function parseImageBlock(line: string): ImageBlock | null {
  const imageMatch = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]+)")?\)$/);
  if (!imageMatch) return null;

  return {
    alt: imageMatch[1],
    src: imageMatch[2],
    title: imageMatch[3],
  };
}

function parseCaption(line: string): string | null {
  const captionMatch = line.match(/^_(.+)_$/) ?? line.match(/^\*(.+)\*$/);
  return captionMatch ? captionMatch[1] : null;
}

export default function Markdown({ source }: MarkdownProps) {
  const lines = source.split(/\r?\n/);
  const elements: ReactNode[] = [];
  const paragraph: string[] = [];
  const listItems: string[] = [];
  const blockquote: string[] = [];
  let orderedList = false;
  let codeBlock: string[] | null = null;
  let pendingFigure: ImageBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (pendingFigure) {
      const caption = parseCaption(trimmed.trim());
      flushFigure(pendingFigure, elements, caption ?? undefined);
      pendingFigure = null;

      if (caption) {
        continue;
      }
    }

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
      flushList(listItems, elements, orderedList);
      flushBlockquote(blockquote, elements);
      codeBlock = [];
      continue;
    }

    if (trimmed === "") {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements, orderedList);
      flushBlockquote(blockquote, elements);
      continue;
    }

    const imageBlock = parseImageBlock(trimmed.trim());
    if (imageBlock) {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements, orderedList);
      flushBlockquote(blockquote, elements);
      pendingFigure = imageBlock;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements, orderedList);
      flushBlockquote(blockquote, elements);
      const level = headingMatch[1].length;
      const HeadingTag = `h${Math.min(
        level,
        6,
      )}` as keyof HTMLElementTagNameMap;
      elements.push(
        <HeadingTag key={getKey("heading")}>
          {parseInline(headingMatch[2])}
        </HeadingTag>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph(paragraph, elements);
      flushBlockquote(blockquote, elements);
      if (orderedList) {
        flushList(listItems, elements, orderedList);
        orderedList = false;
      }
      listItems.push(trimmed.slice(2));
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      flushParagraph(paragraph, elements);
      flushBlockquote(blockquote, elements);
      if (!orderedList && listItems.length > 0) {
        flushList(listItems, elements, orderedList);
      }
      orderedList = true;
      listItems.push(orderedListMatch[1]);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph(paragraph, elements);
      flushList(listItems, elements, orderedList);
      blockquote.push(trimmed.slice(2));
      continue;
    }

    flushBlockquote(blockquote, elements);
    paragraph.push(trimmed);
  }

  flushFigure(pendingFigure, elements);
  flushCode(codeBlock, elements);
  flushParagraph(paragraph, elements);
  flushList(listItems, elements, orderedList);
  flushBlockquote(blockquote, elements);

  return <>{elements}</>;
}
