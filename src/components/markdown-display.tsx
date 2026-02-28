"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Props = {
  content: string;
  className?: string;
};

export function MarkdownDisplay({ content, className }: Props) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className="max-w-full rounded-md border"
              style={{ maxHeight: "400px", objectFit: "contain" }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
