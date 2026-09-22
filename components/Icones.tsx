export function Chama({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 3c1.2 4.2 7.5 8.6 7.5 14.4A7.5 7.5 0 0 1 16 25a7.5 7.5 0 0 1-7.5-7.6C8.5 11.6 14.8 7.2 16 3Z"
        fill="var(--ouro)"
      />
      <path d="M16 15c.6 2 3 3.6 3 6a3 3 0 0 1-6 0c0-2.4 2.4-4 3-6Z" fill="var(--tinta)" />
      <rect x="9" y="27" width="14" height="2" rx="1" fill="var(--ouro)" />
    </svg>
  );
}

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconeLivro = () => (
  <svg {...base}>
    <path d="M12 6.5C10.3 5.3 8 4.8 4.5 5v13c3.5-.2 5.8.3 7.5 1.5 1.7-1.2 4-1.7 7.5-1.5V5c-3.5-.2-5.8.3-7.5 1.5Z" />
    <path d="M12 6.5v13" />
  </svg>
);
export const IconeConversa = () => (
  <svg {...base}>
    <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z" />
  </svg>
);
export const IconeCaminho = () => (
  <svg {...base}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16" />
  </svg>
);
export const IconeEnviar = () => (
  <svg {...base}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </svg>
);
export const IconeCheck = () => (
  <svg {...base} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const IconeTelefone = () => (
  <svg {...base}>
    <path d="M5 4h3.5l1.8 4.5-2.2 1.4a11 11 0 0 0 5 5l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
