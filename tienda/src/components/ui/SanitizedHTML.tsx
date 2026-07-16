'use client';

import DOMPurify from 'dompurify';

export default function SanitizedHTML({ html, className }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'className', 'title', 'target', 'rel'],
  });

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
