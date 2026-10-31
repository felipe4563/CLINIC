'use client';
import { useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { mensajeError } from '@/lib/types';

const EXPEDIDO = [
  ['CB', 'Cochabamba'], ['LP', 'La Paz'], ['SC', 'Santa Cruz'], ['OR', 'Oruro'], ['PT', 'Potosí'],
  ['CH', 'Chuquisaca'], ['TJ', 'Tarija'], ['BE', 'Beni'], ['PD', 'Pando'], ['EX', 'Extranjero'],
];
const PAISES = [
  ['591', 'Bolivia (+591)'], ['54', 'Argentina (+54)'], ['55', 'Brasil (+55)'], ['56', 'Chile (+56)'],
  ['51', 'Perú (+51)'], ['1', 'EE. UU. (+1)'], ['34', 'España (+34)'],
];
const COMO_NOS_CONOCIO = ['Instagram', 'Facebook', 'TikTok', 'Google', 'Recomendación de alguien', 'Pasé por la clínica', 'Otro'];

const FICHA_VACIA = {
  carnet: '', expedido: 'CB', complemento: '', nombre: '', apellidos: '', sexo: '', edad: '',
  pais: '591', telefono: '', conocio: '',
};

export default function StepPaciente() {
  const { paciente, setPaciente, setStep } = useBooking();
  const [modo, setModo] = useState<'existente' | 'nuevo' | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [ci, setCi] = useState('');
  const [tel, setTel] = useState('');
  const [f, setF] = useState(FICHA_VACIA);
  const campo = (k: keyof typeof FICHA_VACIA) => ({
    value: f[k],
    onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }),
  });

  function cambiarModo(m: 'existente' | 'nuevo') {
    setModo(m);
    setError('');
    setPaciente(null);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { token, nombre } = await api.loginConCi(ci.trim(), tel.trim());
      api.setToken(token);
      setPaciente({ nombre });
    } catch (err: unknown) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digitos = f.telefono.replace(/\D/g, '');
    if (digitos.length < 7) {
      setError('Revisa tu número de teléfono.');
      return;
    }
    const edad = Number(f.edad);
    if (!Number.isInteger(edad) || edad < 0 || edad > 120) {
      setError('Revisa tu edad.');
      return;
    }
    setCargando(true);
    try {
      const { token, nombre } = await api.registro({
        telefono: `${f.pais}${digitos}`,
        nombre_completo: `${f.nombre.trim()} ${f.apellidos.trim()}`,
        carnet_identidad: f.carnet.trim(),
        carnet_complemento: f.complemento.trim() || null,
        carnet_expedido: f.expedido,
        sexo: f.sexo,
        edad,
        como_nos_conocio: f.conocio,
      });
      api.setToken(token);
      setPaciente({ nombre });
      setStep('horario');
    } catch (err: unknown) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-[clamp(30px,3.4vw,42px)] font-light leading-tight text-espresso">¿Es tu primera vez con nosotros?</h2>
      <p className="mt-1 text-[15px] text-tan">Elige la opción que te corresponde.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Opcion
          activa={modo === 'existente'}
          onClick={() => cambiarModo('existente')}
          titulo="Ya vine antes"
          texto="Tienes ficha con nosotros. Te buscamos con tu CI y tu teléfono."
          icono={<path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0" />}
        />
        <Opcion
          activa={modo === 'nuevo'}
          onClick={() => cambiarModo('nuevo')}
          titulo="Es mi primera vez"
          texto="Creamos tu ficha en menos de 2 minutos."
          icono={<path d="M10 12a4 4 0 100-8 4 4 0 000 8zM2.5 20a7.5 7.5 0 0113.2-4.9M19 14v6M16 17h6" />}
        />
      </div>

      {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {modo === 'existente' && (
        <form onSubmit={buscar} className="mt-6 rounded-3xl bg-white p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Campo etiqueta="CI">
              <input required inputMode="numeric" autoComplete="off" value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Ej: 9391668" className={INPUT} />
            </Campo>
            <Campo etiqueta="Teléfono registrado">
              <input required type="tel" inputMode="tel" autoComplete="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Ej: 71234567" className={INPUT} />
            </Campo>
            <button type="submit" disabled={cargando} className="min-h-12 rounded-full bg-espresso px-7 text-[15px] text-cream hover:bg-espresso-900 disabled:opacity-50">
              {cargando ? 'Buscando…' : 'Buscar mi ficha'}
            </button>
          </div>
          {paciente && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-neutral-cream px-5 py-4">
              <p className="text-[15px] text-espresso">
                <span className="font-medium">¡Hola, {paciente.nombre}!</span> Encontramos tu ficha.
              </p>
              <button type="button" onClick={() => setStep('horario')} className="shrink-0 rounded-full bg-espresso px-5 py-2 text-sm text-cream">
                Elegir horario
              </button>
            </div>
          )}
        </form>
      )}

      {modo === 'nuevo' && (
        <form onSubmit={crear} className="mt-6 rounded-3xl bg-white p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.2em] text-tan">Datos personales</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-[1fr_150px] gap-3">
              <Campo etiqueta="CI *">
                <input required inputMode="numeric" {...campo('carnet')} className={INPUT} />
              </Campo>
              <Campo etiqueta="Expedido *">
                <select required {...campo('expedido')} className={INPUT}>
                  {EXPEDIDO.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </Campo>
            </div>
            <Campo etiqueta="Complemento (opcional)">
              <input {...campo('complemento')} placeholder="Ej: 1A" className={INPUT} />
            </Campo>
            <Campo etiqueta="Nombre *">
              <input required autoComplete="given-name" {...campo('nombre')} className={INPUT} />
            </Campo>
            <Campo etiqueta="Apellidos *">
              <input required autoComplete="family-name" {...campo('apellidos')} className={INPUT} />
            </Campo>
            <Campo etiqueta="Género *">
              <select required {...campo('sexo')} className={INPUT}>
                <option value="" disabled>Seleccionar</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </Campo>
            <Campo etiqueta="Edad *">
              <input required type="number" inputMode="numeric" min={0} max={120} step={1} placeholder="Ej: 32" {...campo('edad')} className={INPUT} />
            </Campo>
            <Campo etiqueta="Teléfono (WhatsApp) *">
              <div className="grid grid-cols-[150px_1fr] gap-2">
                <select aria-label="País" {...campo('pais')} className={INPUT}>
                  {PAISES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
                <input required type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Ej: 71234567" {...campo('telefono')} className={INPUT} />
              </div>
            </Campo>
            <Campo etiqueta="¿Cómo nos conociste? *">
              <select required {...campo('conocio')} className={INPUT}>
                <option value="" disabled>Seleccionar</option>
                {COMO_NOS_CONOCIO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
          </div>
          <button type="submit" disabled={cargando} className="mt-6 min-h-12 w-full rounded-full bg-espresso px-7 text-[15px] text-cream hover:bg-espresso-900 disabled:opacity-50">
            {cargando ? 'Guardando…' : 'Guardar y continuar'}
          </button>
          <p className="mt-3 text-center text-xs text-tan">Tus datos quedan en tu ficha clínica y solo los ve el equipo de la clínica.</p>
        </form>
      )}
    </div>
  );
}

const INPUT =
  'min-h-12 w-full rounded-2xl border border-manhattan/70 bg-cream/40 px-4 text-[15px] text-ink placeholder:text-tan/60 focus:border-espresso focus:bg-white focus:outline-none';

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-espresso">{etiqueta}</span>
      {children}
    </label>
  );
}

function Opcion({ activa, onClick, titulo, texto, icono }: { activa: boolean; onClick: () => void; titulo: string; texto: string; icono: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`relative flex items-center gap-5 rounded-3xl border p-5 text-left transition-all sm:flex-col sm:items-start sm:p-7 ${
        activa ? 'border-espresso bg-espresso text-cream shadow-[0_30px_60px_-36px_rgba(45,36,30,0.9)]' : 'border-manhattan/60 bg-white text-espresso hover:-translate-y-0.5 hover:border-manhattan'
      }`}
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${activa ? 'bg-white/10' : 'bg-neutral-cream'}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icono}
        </svg>
      </span>
      <span>
        <span className="block font-serif text-[28px] leading-tight sm:text-[34px]">{titulo}</span>
        <span className={`mt-1 block text-[15px] leading-relaxed ${activa ? 'text-arena' : 'text-tan'}`}>{texto}</span>
      </span>
      {activa && (
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-espresso">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
    </button>
  );
}
