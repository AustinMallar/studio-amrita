import { htmlToParagraphs } from "@/lib/html-text";

type ProductDescriptionProps = {
  html: string;
  className?: string;
};

export function ProductDescription({ html, className }: ProductDescriptionProps) {
  const paragraphs = htmlToParagraphs(html);
  if (paragraphs.length === 0) return null;

  return (
    <div className={className ?? "flex flex-col gap-4"}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="font-sans leading-relaxed text-body">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
