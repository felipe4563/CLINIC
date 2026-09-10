import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-manhattan/30 px-6 py-16">
      <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-3">
        <div>
          <Image
            src="/novaged-assets/horizontal_dark-YqD6kOfW.png"
            alt="Clinic NovagED"
            width={180}
            height={54}
            className="h-10 w-auto mb-4"
          />
          <p className="text-sm text-espresso max-w-xs">
            Un espacio profesional y confiable donde la ciencia y la estética se
            encuentran para revelar tu mejor versión.
          </p>
          <div className="flex gap-4 mt-6 text-espresso/60">
            {/* PLACEHOLDER: replace with real Instagram/TikTok links */}
            <a href="#" aria-label="Instagram" className="hover:text-manhattan transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1"/></svg>
            </a>
            <a href="#" aria-label="TikTok" className="hover:text-manhattan transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3v13.2a2.7 2.7 0 1 1-2.2-2.66v-3.05a5.75 5.75 0 1 0 5.2 5.71V8.8a7.6 7.6 0 0 0 4.3 1.33V7.1a4.6 4.6 0 0 1-4.3-4.4z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-tan mb-4">Navegación</p>
          <ul className="space-y-2 text-sm text-espresso">
            <li><a href="#tratamientos" className="hover:text-manhattan transition-colors">Tratamientos</a></li>
            <li><a href="#nosotros" className="hover:text-manhattan transition-colors">Nosotros</a></li>
            <li><a href="#ubicacion" className="hover:text-manhattan transition-colors">Ubicación</a></li>
          </ul>
        </div>
        <div className="text-sm text-espresso md:text-right">
          <p>© 2026 Clinic NovagED. Todos los derechos reservados.</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-manhattan">Cochabamba · Bolivia</p>
        </div>
      </div>
    </footer>
  );
}
