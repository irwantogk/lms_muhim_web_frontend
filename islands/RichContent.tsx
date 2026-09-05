import { useEffect, useRef } from "preact/hooks";

export interface RichContentProps {
  content: string;
}

export default function RichContent({ content }: RichContentProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div
      ref={ref}
      class="[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_h2]:mb-1 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-medium [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_code]:break-words [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
    />
  );
}
