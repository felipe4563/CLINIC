'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { IconBell } from '@/components/icons';

type Config = {
  recordatorio_24h: boolean;
  recordatorio_2h: boolean;
  no_show: boolean;
  post_consulta: boolean;
  saldo_pendiente: boolean;
};

type Notificacion = {
  id: number;
  tipo: keyof Config;
  enviado_at: string;
  Cita?: { Paciente: { nombre_completo: string } } | null;
  Pago?: { Cita: { Paciente: { nombre_completo: string } } } | null;
};

const TIPOS: { clave: keyof Config; titulo: string; descripcion: string }[] = [
  {
    clave: 'recordatorio_24h',
    titulo: 'Recordatorio 24h antes',
    descripcion: 'Envía un WhatsApp automático un día antes de cada cita confirmada.',
  },
  {
    clave: 'recordatorio_2h',
    titulo: 'Recordatorio 2h antes',
    descripcion: 'Envía un WhatsApp automático 2 horas antes de cada cita confirmada.',
  },
  {
    clave: 'no_show',
    titulo: 'Aviso de inasistencia',
    descripcion: 'Cuando marcas una cita como "No asistió", se envía un mensaje automático al paciente.',
  },
  {
    clave: 'post_consulta',
    titulo: 'Mensaje post-consulta',
    descripcion: 'Cuando marcas una cita como "Completada", se envía un mensaje de agradecimiento.',
  },
  {
    clave: 'saldo_pendiente',
    titulo: 'Recordatorio de saldo pendiente',
    descripcion: 'Avisa automáticamente a los pacientes con un saldo de cita por cobrar.',
  },
];

const TIPO_LABEL: Record<keyof Config, string> = {
  recordatorio_24h: 'Recordatorio 24h',
  recordatorio_2h: 'Recordatorio 2h',
  no_show: 'Aviso de inasistencia',
  post_consulta: 'Mensaje post-consulta',
  saldo_pendiente: 'Saldo pendiente',
};

function nombrePaciente(n: Notificacion) {
  return n.Cita?.Paciente.nombre_completo || n.Pago?.Cita.Paciente.nombre_completo || 'Paciente';
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AutomatizacionPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<keyof Config | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.getAutomatizacion();
      setConfig(res.config);
      setNotificaciones(res.notificaciones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function toggle(clave: keyof Config) {
    if (!config) return;
    const valor = !config[clave];
    setGuardando(clave);
    setConfig({ ...config, [clave]: valor });
    try {
      await api.actualizarAutomatizacion({ [clave]: valor });
    } catch (err) {
      setConfig(config);
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <IconBell className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Automatización</h1>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Mensajes de WhatsApp que se envían solos según lo que pasa con cada cita. Puedes activar o desactivar cada tipo.
      </p>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {TIPOS.map((t) => (
          <div key={t.clave} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-panel p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.descripcion}</p>
            </div>
            <button
              onClick={() => toggle(t.clave)}
              disabled={!config || guardando === t.clave}
              role="switch"
              aria-checked={config?.[t.clave] ?? false}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
              style={{ background: config?.[t.clave] ? 'var(--accent)' : 'var(--border)' }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
                style={{
                  left: 2,
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  transform: config?.[t.clave] ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Últimos mensajes automáticos enviados</h2>
      <div className="flex flex-col gap-2">
        {notificaciones.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{TIPO_LABEL[n.tipo]}</span> — {nombrePaciente(n)}
            </span>
            <span className="text-xs text-muted-foreground">{fmtFecha(n.enviado_at)}</span>
          </div>
        ))}
        {notificaciones.length === 0 && <p className="text-sm text-muted-foreground">Todavía no se envió ningún mensaje automático.</p>}
      </div>
    </div>
  );
}
