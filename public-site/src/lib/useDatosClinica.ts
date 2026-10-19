'use client';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { ConfiguracionPublica } from './types';

// La portada pide la configuración una sola vez, aunque varias secciones la usen.
// Si la API falla, cada sección muestra su texto de respaldo.
let configuracion: Promise<ConfiguracionPublica | null> | null = null;

function cargarConfiguracion() {
  configuracion ??= api.getConfiguracionPublica().catch(() => {
    configuracion = null; // se reintenta en la próxima visita
    return null;
  });
  return configuracion;
}

export function useConfiguracion(): ConfiguracionPublica | null {
  const [config, setConfig] = useState<ConfiguracionPublica | null>(null);
  useEffect(() => {
    let vivo = true;
    cargarConfiguracion().then((c) => {
      if (vivo) setConfig(c);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return config;
}

export const CONTACTO_RESPALDO = {
  direccion: 'Edificio Vedra planta baja, calle Lanza N.º 670 entre Chuquisaca y Av. Salamanca',
  ciudad: 'Cochabamba',
  pais: 'Bolivia',
  telefono: '+591 65359810',
  email: 'info@novaged.com',
};

export function datosContacto(config: ConfiguracionPublica | null) {
  const direccion = config?.direccion?.trim() || CONTACTO_RESPALDO.direccion;
  const ciudad = config?.ciudad?.trim() || CONTACTO_RESPALDO.ciudad;
  const pais = config?.pais?.trim() || CONTACTO_RESPALDO.pais;
  const telefono = config?.telefono?.trim() || CONTACTO_RESPALDO.telefono;
  const email = config?.email?.trim() || CONTACTO_RESPALDO.email;
  const digitos = telefono.replace(/\D/g, '');
  // WhatsApp necesita el código de país: los números bolivianos de 8 dígitos llevan 591.
  const whatsapp = digitos.length === 8 ? `591${digitos}` : digitos;
  return { direccion, ciudad, pais, telefono, email, whatsapp, completa: `${direccion}, ${ciudad}, ${pais}` };
}

export function enlaceWhatsapp(numero: string, mensaje = 'Hola, quisiera información sobre los tratamientos de Clinic NovagED.') {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
