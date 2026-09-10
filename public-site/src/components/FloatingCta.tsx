'use client';

export default function FloatingCta({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-4 shadow-lg hover:bg-tan transition-colors"
    >
      Agenda tu cita
    </button>
  );
}
