export default function EnConstruccion({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">{titulo}</h1>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-panel px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 3.5 20.5 9.5 9 21H3v-6L14.5 3.5Z" />
            <path d="M13 5 19 11" />
          </svg>
        </span>
        <p className="mt-4 text-sm font-medium">Módulo en construcción</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {descripcion || 'Todavía no está disponible. Lo vamos a desarrollar como siguiente paso.'}
        </p>
      </div>
    </div>
  );
}
