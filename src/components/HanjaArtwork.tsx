import type { ComponentPropsWithoutRef } from 'react';

const artworks = {
  prolog: { label: '一切唯心造', width: 2142, height: 513 },
  about: { label: '百戰老將', width: 1724, height: 629 },
  works: { label: '實戰記錄', width: 1319, height: 511 },
  portfolio: { label: '靑出於藍', width: 1327, height: 482 },
  epilogue: { label: '勇往直前', width: 1264, height: 552 },
};

interface HanjaArtworkProps extends ComponentPropsWithoutRef<'span'> {
  artwork: keyof typeof artworks;
  compact?: boolean;
}

export default function HanjaArtwork({
  artwork,
  compact = false,
  className = '',
  ...props
}: HanjaArtworkProps) {
  const { label, width, height } = artworks[artwork];
  const size = compact
    ? 'h-12 sm:h-14'
    : 'mt-6 h-[10vw] sm:h-[7vw] md:h-[clamp(3rem,5vw,6.75rem)]';

  return (
    <span
      {...props}
      role="img"
      aria-label={label}
      className={`mx-auto block max-w-full shrink-0 text-[#A52A43] ${size} ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <span
        aria-hidden="true"
        className="block h-full w-full bg-current mask-contain mask-center mask-no-repeat"
        style={{ maskImage: `url("/assets/hanja/${artwork}.svg")` }}
      />
    </span>
  );
}
