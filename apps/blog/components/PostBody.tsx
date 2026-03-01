import { marked } from "marked";

interface PostBodyProps {
  contentMarkdown: string;
  contentHtml?: string | null;
}

export function PostBody({ contentMarkdown, contentHtml }: PostBodyProps) {
  const html = contentHtml ?? marked.parse(contentMarkdown, { async: false });

  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
