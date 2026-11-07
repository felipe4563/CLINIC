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
  estado?: 'enviado' | 'fallido';
  error?: string | null;
  // Sequelize nombra "Citum" a la cita vista desde la notificación.
  Citum?: { fecha: string; hora_inicio: string; Paciente: { nombre_completo: string } } | null;
  Pago?: { Cita: { fecha: string; hora_inicio: string; Paciente: { nombre_completo: string } } } | null;
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
  return n.Citum?.Paciente?.nombre_completo || n.Pago?.Cita?.Paciente?.nombre_completo || 'Paciente';
}

// "cita del 09/11 a las 10:30", para saber de qué cita era el mensaje.
function citaDe(n: Notificacion) {
  const c = n.Citum || n.Pago?.Cita;
  if (!c) return '';
  const [, m, d] = c.fecha.split('-');
  return `cita del ${d}/${m} a las ${c.hora_inicio.slice(0, 5)}`;
}

type EstadoWhatsApp = { conectado: boolean; plantillas: Record<string, string | null>; fallidos: number };

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AutomatizacionPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<keyof Config | null>(null);
  const [whatsapp, setWhatsapp] = useState<EstadoWhatsApp | null>(null);
  const [telefonoPrueba, setTelefonoPrueba] = useState('');
  const [prueba, setPrueba] = useState<{ ok: boolean; texto: string } | null>(null);
  const [probando, setProbando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await api.getAutomatizacion();
      setConfig(res.config);
      setNotificaciones(res.notificaciones);
      setWhatsapp(res.whatsapp ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function enviarPrueba() {
    setProbando(true);
    setPrueba(null);
    try {
      const res = await api.probarWhatsApp(telefonoPrueba);
      setPrueba({ ok: true, texto: `Enviado a ${res.telefono}. Debe llegar un "Hello World" de WhatsApp.` });
    } catch (err) {
      setPrueba({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo enviar' });
    } finally {
      setProbando(false);
    }
  }

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

      {whatsapp && (
        <div className={`mb-5 rounded-xl border p-4 ${whatsapp.conectado ? 'border-border bg-panel' : 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${whatsapp.conectado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <p className="text-sm font-semibold">{whatsapp.conectado ? 'WhatsApp conectado' : 'WhatsApp no conectado'}</p>
            {whatsapp.fallidos > 0 && (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                {whatsapp.fallidos} {whatsapp.fallidos === 1 ? 'mensaje falló' : 'mensajes fallaron'}
              </span>
            )}
          </div>
          {whatsapp.conectado ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={telefonoPrueba}
                onChange={(e) => setTelefonoPrueba(e.target.value)}
                placeholder="Tu celular, ej. 71234567"
                inputMode="tel"
                className="w-52 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
              />
              <button
                onClick={enviarPrueba}
                disabled={probando || telefonoPrueba.replace(/\D/g, '').length < 8}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                {probando ? 'Enviando…' : 'Enviar mensaje de prueba'}
              </button>
              {prueba && <p className={`w-full text-xs ${prueba.ok ? 'text-muted-foreground' : 'text-danger'}`}>{prueba.texto}</p>}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Los mensajes no se están enviando: falta conectar la cuenta de WhatsApp Business de la clínica en el servidor. Los interruptores de abajo quedan
              guardados y empiezan a funcionar apenas se conecte.
            </p>
          )}
          {whatsapp.conectado && Object.entries(whatsapp.plantillas).some(([, v]) => !v) && (
            <p className="mt-2 text-xs text-danger">
              Falta configurar la plantilla de: {Object.entries(whatsapp.plantillas).filter(([, v]) => !v).map(([k]) => k).join(', ')}.
            </p>
          )}
        </div>
      )}

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
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform"
                style={{ transform: config?.[t.clave] ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold">Últimos mensajes automáticos</h2>
      <div className="flex flex-col gap-2">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${n.estado === 'fallido' ? 'border-danger/40 bg-danger/5' : 'border-border bg-panel'}`}
          >
            <span className="min-w-0">
              <span className="font-medium">{TIPO_LABEL[n.tipo]}</span> — {nombrePaciente(n)}
              {citaDe(n) && <span className="text-xs text-muted-foreground"> · {citaDe(n)}</span>}
              {n.estado === 'fallido' && <span className="block text-xs text-danger">No se envió: {n.error || 'error desconocido'}</span>}
            </span>
            <span className="text-xs text-muted-foreground">
              {n.estado === 'fallido' ? 'Último intento ' : ''}
              {fmtFecha(n.enviado_at)}
            </span>
          </div>
        ))}
        {notificaciones.length === 0 && <p className="text-sm text-muted-foreground">Todavía no se envió ningún mensaje automático.</p>}
      </div>
    </div>
  );
}
