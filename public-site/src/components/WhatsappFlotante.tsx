'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TELEFONO_FALLBACK } from './Contacto';

const MENSAJE = 'Hola, quisiera información sobre los tratamientos de Clinic NovagED.';

// Botón flotante (abajo a la izquierda; "Agenda tu cita" ocupa la derecha) que abre un chat de WhatsApp
// con el teléfono de la Configuración de la clínica.
export default function WhatsappFlotante() {
  const [telefono, setTelefono] = useState(TELEFONO_FALLBACK);

  useEffect(() => {
    api
      .getConfiguracionPublica()
      .then((c: { telefono?: string | null } | null) => { if (c?.telefono) setTelefono(c.telefono); })
      .catch(() => {});
  }, []);

  const numero = telefono.replace(/\D/g, '');
  if (!numero) return null;

  return (
    <a
      href={`https://wa.me/${numero}?text=${encodeURIComponent(MENSAJE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7" fill="currentColor">
        <path d="M16.04 3C8.86 3 3.02 8.83 3.02 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.74A13 13 0 0 0 16.04 29C23.2 29 29.05 23.17 29.05 16S23.2 3 16.04 3Zm0 23.8c-1.98 0-3.92-.53-5.61-1.53l-.4-.24-3.96 1.03 1.06-3.86-.26-.41A10.74 10.74 0 0 1 5.26 16c0-5.94 4.84-10.77 10.78-10.77S26.8 10.06 26.8 16s-4.83 10.8-10.77 10.8Zm5.9-8.07c-.32-.16-1.91-.94-2.2-1.05-.3-.1-.52-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.65.15-.15.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.72-1.74-1-2.38-.26-.62-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.11 1.32 3.33.16.21 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.25 1.48.21 2.03.13.62-.09 1.91-.78 2.18-1.53.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
