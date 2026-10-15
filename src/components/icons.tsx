export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M24 11 L28.2 25.2 L24 22.2 L19.8 25.2 Z" fill="currentColor" />
      <circle cx="24" cy="26" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function GroundIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 15.5h1.2l1.1-3.2A2 2 0 0 1 7.2 11h6.2a2 2 0 0 1 1.9 1.3L16.6 15.5H18a2 2 0 0 1 2 2V19a1 1 0 0 1-1 1h-1.1a2.2 2.2 0 0 1-4.2 0H8.3a2.2 2.2 0 0 1-4.2 0H3a1 1 0 0 1-1-1v-1.5a2 2 0 0 1 1-1.8V15.5Zm3.1 3.2a1.1 1.1 0 1 0 0 .1 1.1 1.1 0 0 0 0-.1Zm9.7 0a1.1 1.1 0 1 0 .1 0h-.1ZM7.2 12.2l-.7 2.1h7.7l-.8-2.1H7.2Z"
      />
    </svg>
  );
}

export function DroneIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.2 7.2a2.4 2.4 0 1 1-1.7 2.2l2.2 1.1-1.5 1.5H5.2v1.6h2.6l2.1-2.1 1.1.6v2.7h1.8v-2.7l1.1-.6 2.1 2.1h2.6v-1.6h-2l-1.5-1.5 2.2-1.1a2.4 2.4 0 1 1-.6-1.5l-2.4 1.2L12 8.8l-1.3 1.3-2.4-1.2a2.4 2.4 0 0 1-.1-1.7ZM6.6 6.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10.8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}
