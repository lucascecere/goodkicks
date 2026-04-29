interface ColorSwatchProps {
  color: string;
  title: string;
  selected: boolean;
  onClick: () => void;
}

export function ColorSwatch({ color, title, selected, onClick }: ColorSwatchProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={`Select ${title}`}
      aria-pressed={selected}
      className={[
        'w-8 h-8 rounded-full transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rust focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream',
        selected ? 'ring-2 ring-brand-ink ring-offset-2 ring-offset-brand-cream scale-110' : 'hover:scale-105',
      ].filter(Boolean).join(' ')}
      style={{ backgroundColor: color }}
    />
  );
}
