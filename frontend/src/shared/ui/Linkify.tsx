/**
 * SmartTask360 — Linkify component
 * Automatically converts URLs, markdown links, and @mentions to styled elements
 * Supports:
 * - Raw URLs: https://example.com
 * - Markdown links: [link text](https://example.com)
 * - @mentions: @Имя Фамилия or @Name
 */

import React from "react";

interface LinkifyProps {
  children: string;
  className?: string;
}

// Combined pattern: markdown links [text](url) OR @mentions OR raw URLs
// Order matters: markdown links first, then @mentions, then raw URLs
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(@[А-Яа-яЁёA-Za-z]+(?:\s+[А-Яа-яЁёA-Za-z]+)?)|(https?:\/\/[^\s<\[\]]+[^<.,:;"')\]\s])/g;

/**
 * Splits text by links/mentions and returns React elements with styled elements
 */
export function Linkify({ children, className }: LinkifyProps) {
  if (!children) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(children)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown link: [text](url)
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {linkText}
        </a>
      );
      lastIndex = match.index + match[0].length;
    } else if (match[3]) {
      // @mention
      const mention = match[3];
      parts.push(
        <span
          key={match.index}
          className="text-blue-600 font-medium bg-blue-50 px-0.5 rounded"
        >
          {mention}
        </span>
      );
      lastIndex = match.index + mention.length;
    } else if (match[4]) {
      // Raw URL
      const url = match[4];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline break-all"
        >
          {url}
        </a>
      );
      lastIndex = match.index + url.length;
    }
  }

  // Add remaining text
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
