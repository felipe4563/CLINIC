'use client';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { MiembroEquipo } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Las fotos subidas desde el panel viven en la API; las demás son de la propia web.
export function fotoSrc(fotoUrl: string | null | undefined): string | null {
  if (!fotoUrl) return null;
  return fotoUrl.startsWith('/uploads/') ? `${API_URL}${fotoUrl}` : fotoUrl;
}

// Lo que mostraba la web antes de que el equipo se cargue desde el panel. Se usa
// mientras la doctora no tenga su perfil publicado, para que la sección no quede vacía.
export const DOCTORA_RESPALDO = {
  nombre: 'Dra. Maria Noemi Ponce Caisiri',
  cargo: 'Médico cirujano-ultrasonografista · Médico estético',
  foto: '/novaged-assets/DraNovaged-CZHbEtUk.jpeg',
  parrafos: [
    'Médico cirujano-ultrasonografista. Médico estético especialista en rejuvenecimiento y armonización facial y corporal, con técnicas avanzadas en armonización facial, antiedad, lifting, bioestimuladores de colágeno, fillers (ácido hialurónico), hilos, neuromodulación (toxina botulínica o Botox), enzimas recombinantes, enzimas lipolíticas y aparatología, con seguimiento médico especializado.',
    'Brinda tratamientos seguros, buscando resultados naturales y armónicos con protocolos personalizados para cada paciente. Clinic NovagED tiene un enfoque integral: suma ginecología, ecografía y fisioterapia, con compromiso y profesionalismo.',
  ],
  formacion: [
    { titulo: 'Colegio Médico', detalle: 'Miembro, Cochabamba' },
    { titulo: 'SEDES', detalle: 'Médica matriculada, Cochabamba' },
    { titulo: 'ASOBOME', detalle: 'Miembro, Cochabamba' },
    { titulo: 'Doble titulación', detalle: 'Colegio Médico de Lima, Perú' },
  ],
};

// Se pide una sola vez por visita aunque varias secciones lo usen. Si falla, queda vacío.
let equipo: Promise<MiembroEquipo[]> | null = null;

function cargarEquipo() {
  equipo ??= api.getEquipo().catch(() => {
    equipo = null; // se reintenta en la próxima visita
    return [];
  });
  return equipo;
}

// null mientras carga; [] si nadie está publicado o la API no responde.
export function useEquipo(): MiembroEquipo[] | null {
  const [lista, setLista] = useState<MiembroEquipo[] | null>(null);
  useEffect(() => {
    let vivo = true;
    cargarEquipo().then((l) => {
      if (vivo) setLista(l);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return lista;
}
