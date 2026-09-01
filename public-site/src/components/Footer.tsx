export default function Footer() {
  return (
    <footer className="bg-cream border-t border-tan/20 px-6 py-16">
      <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl text-tan mb-4">Clinic NovagED</p>
          <p className="text-sm text-muted max-w-xs">
            Un espacio profesional y confiable donde la ciencia y la estética se
            encuentran para revelar tu mejor versión.
          </p>
          <div className="flex gap-4 mt-6 text-muted">
            {/* PLACEHOLDER: replace with real Instagram/TikTok links */}
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="TikTok">TT</a>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-4">Navegación</p>
          <ul className="space-y-2 text-sm text-ink">
            <li><a href="#tratamientos">Tratamientos</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#ubicacion">Ubicación</a></li>
          </ul>
        </div>
        <div className="text-sm text-muted md:text-right">
          <p>© 2026 Clinic NovagED. Todos los derechos reservados.</p>
          <p className="mt-1">Cochabamba · Bolivia</p>
        </div>
      </div>
    </footer>
  );
}
