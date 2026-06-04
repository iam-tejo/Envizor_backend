export function OutlinedHexagonCoreIcon({
  size = 90,
  stroke = "#ffffff",
}: {
  size?: number;
  stroke?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={stroke}
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="50 5, 90 27.5, 90 72.5, 50 95, 10 72.5, 10 27.5" />
      <circle cx="50" cy="50" r="12" strokeWidth="5" />
    </svg>
  );
}
