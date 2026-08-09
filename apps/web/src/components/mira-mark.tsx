export function MiraMark(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="mira-mark"
      viewBox="0 0 72 72"
      fill="none"
    >
      <path
        d="M8 61V12l28 24 28-24v49H51V39L36 52 21 39v22H8Z"
        fill="currentColor"
      />
      <path
        d="m7 27 58 31"
        stroke="var(--mira-cut, #a47c45)"
        strokeWidth="4"
        strokeLinecap="square"
      />
      <path
        d="m11 26 50 27"
        stroke="var(--mira-glint, #792d3d)"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}
