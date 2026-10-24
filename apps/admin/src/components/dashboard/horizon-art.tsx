/** Decorative route lines. No external image, font, or service is needed. */
export function HorizonArt() {
  return (
    <svg className="horizon-art" viewBox="0 0 680 220" fill="none" aria-hidden="true">
      <path
        className="horizon-contour"
        d="M-20 190C120 190 120 35 310 48S470 178 700 12M-20 208C140 208 140 56 310 68S490 196 700 40M-20 226C160 226 160 78 310 88S510 214 700 68"
      />
      <path className="horizon-route" d="M60 160C210 160 175 40 330 57S490 180 632 55" />
      <circle cx="60" cy="160" r="5" className="route-point" />
      <circle cx="330" cy="57" r="5" className="route-point" />
      <circle cx="632" cy="55" r="5" className="route-point" />
      <circle cx="330" cy="57" r="17" className="route-ring" />
      <path
        className="route-sail"
        d="M423 103V61L397 103H423ZM429 103V75L445 103H429ZM396 110H446"
      />
    </svg>
  );
}
