import { memo, useMemo } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { prepareMarkdown } from '../../utils/markdown';

// Images are left out on purpose: they would fetch from a remote server while
// showing confidential interview material, and could break image export.
const ALLOWED_ELEMENTS = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'a'];
// Without this, single line breaks in pasted text would merge into one paragraph.
const REMARK_PLUGINS = [remarkBreaks];

const headingClass = 'font-semibold text-[1.1em] leading-snug [&:not(:first-child)]:mt-1.5';

// Colors stay inherited so the text works on any node background.
const COMPONENTS: Components = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-1.5">{children}</p>,
  h1: ({ children }) => <h3 className={headingClass}>{children}</h3>,
  h2: ({ children }) => <h3 className={headingClass}>{children}</h3>,
  h3: ({ children }) => <h3 className={headingClass}>{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-current pl-2 text-left [&:not(:first-child)]:mt-1.5">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="list-disc pl-4 text-left [&:not(:first-child)]:mt-1.5">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="list-decimal pl-5 text-left [&:not(:first-child)]:mt-1.5">
      {children}
    </ol>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="nodrag underline"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  ),
};

interface MarkdownContentProps {
  /** Markdown source, as stored on the actor or relation */
  source: string;
  className?: string;
}

/**
 * Renders description text as Markdown. Raw HTML in the source shows up as
 * literal text, which keeps transcript notation like `<lacht>` readable.
 */
const MarkdownContent = ({ source, className }: MarkdownContentProps) => {
  const prepared = useMemo(() => prepareMarkdown(source), [source]);

  return (
    <div className={`break-words ${className ?? ''}`}>
      <Markdown
        remarkPlugins={REMARK_PLUGINS}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        components={COMPONENTS}
      >
        {prepared}
      </Markdown>
    </div>
  );
};

export default memo(MarkdownContent);
