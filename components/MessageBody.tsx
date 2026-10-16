"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitContent } from "@/lib/segments";
import ImageSlot from "./ImageSlot";

export default function MessageBody({
  messageId, content, images, onGenerated,
}: {
  messageId: string; content: string; images: { slot: number; id: string }[];
  onGenerated: (slot: number, imageId: string) => void;
}) {
  return (
    <>
      {splitContent(content).map((s, i) =>
        s.type === "md" ? (
          <div className="prose" key={i}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.text}</ReactMarkdown>
          </div>
        ) : (
          <ImageSlot
            key={i}
            messageId={messageId}
            slot={s.slot}
            prompt={s.prompt}
            alt={s.alt}
            imageId={images.find((im) => im.slot === s.slot)?.id}
            onGenerated={onGenerated}
          />
        ),
      )}
    </>
  );
}
