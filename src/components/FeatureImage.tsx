import Image from "next/image";

type FeatureImageProps = {
  src: string;
  alt: string;
  aspect?: "wide" | "video";
  sizes?: string;
};

const ASPECT_CLASS: Record<NonNullable<FeatureImageProps["aspect"]>, string> = {
  wide: "aspect-[1200/630]",
  video: "aspect-video",
};

/**
 * FeatureImage — the rounded, bordered hero image that follows the header on
 * every detail page. `wide` matches the generated 1200×630 feature art; `video`
 * is used for case studies with a 16:9 hero.
 */
export default function FeatureImage({
  src,
  alt,
  aspect = "wide",
  sizes = "(max-width: 768px) 100vw, 896px",
}: FeatureImageProps) {
  return (
    <div
      className={`u-rise u-rise-1 relative mt-10 ${ASPECT_CLASS[aspect]} overflow-hidden rounded-xl border border-[var(--u-panel-border)]`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
