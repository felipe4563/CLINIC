'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const DIRECCION_FALLBACK = 'Edificio Vedra planta baja, calle Lanza No 670 entre Chuquisaca y Av. Salamanca, Cochabamba, Bolivia';
const TELEFONO_FALLBACK = '+591 65359810';
const EMAIL_FALLBACK = 'info@novaged.com';

type ConfiguracionPublica = {
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  telefono?: string | null;
  email?: string | null;
};

export default function Ubicacion() {
  const [config, setConfig] = useState<ConfiguracionPublica | null>(null);

  useEffect(() => {
    api
      .getConfiguracionPublica()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const direccion =
    config?.direccion
      ? [config.direccion, config.ciudad, config.pais].filter(Boolean).join(', ')
      : DIRECCION_FALLBACK;
  const telefono = config?.telefono || TELEFONO_FALLBACK;
  const email = config?.email || EMAIL_FALLBACK;
  const mapsQuery = encodeURIComponent(direccion);

  return (
    <section id="ubicacion" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.04em] md:tracking-[0.06em] text-manhattan">Consultorio</h2>

          <div className="mt-10 flex gap-3 text-sm text-espresso">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-tan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21s-7-6.5-7-11.5a7 7 0 1 1 14 0C19 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
            <div className="space-y-2">
              <p>{direccion}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs tracking-widest uppercase text-tan hover:opacity-70 transition-opacity"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-sm text-espresso">
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 shrink-0 text-tan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <a href={`tel:${telefono.replace(/\s+/g, '')}`} className="hover:text-tan transition-colors">{telefono}</a>
            </div>
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 shrink-0 text-tan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
              <a href={`mailto:${email}`} className="hover:text-tan transition-colors">{email}</a>
            </div>
          </div>

          <div className="mt-8 border-t border-manhattan/30 pt-6 text-sm text-espresso">
            <p className="text-xs tracking-widest uppercase text-tan">Horarios de atención</p>
            <p className="mt-2">Lunes a viernes 09:00 - 13:00</p>
            <p>14:00 - 20:00</p>
            <p>Sábado 09:00 - 16:00</p>
          </div>
        </div>

        <div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-manhattan/30">
            <iframe
              title="Ubicación Clinic NovagED"
              src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
              className="h-full w-full border-0 grayscale-[85%] sepia-[18%] contrast-[1.05] brightness-[0.97] saturate-[1.1]"
              loading="lazy"
            />
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block text-center text-xs tracking-widest uppercase text-tan hover:opacity-70 transition-opacity"
          >
            Ver ruta en Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
