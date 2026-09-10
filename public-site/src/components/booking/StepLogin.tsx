'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepLogin() {
  const { setStep } = useBooking();
  const [modo, setModo] = useState<'nuevo' | 'codigo'>('nuevo');

  // Flujo "primera vez": datos del paciente → reserva directa, sin OTP.
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [carnet, setCarnet] = useState('');
  const [complemento, setComplemento] = useState('');
  const [expedido, setExpedido] = useState('');

  // Flujo "ya tengo mi código de cliente" (el que se entrega en recepción)
  const [codigoCliente, setCodigoCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function registrarYContinuar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { token } = await api.registro(telefono, nombre, carnet, complemento, expedido);
      api.setToken(token);
      setStep('confirmar');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function ingresarConCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { token } = await api.loginConCodigo(codigoCliente.trim(), telefonoCliente.trim());
      api.setToken(token);
      setStep('confirmar');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Ingresa tus datos</h3>

      <div className="mt-5 flex gap-2 text-xs uppercase tracking-widest">
        <button
          onClick={() => setModo('nuevo')}
          className={`rounded-full border px-4 py-1.5 ${modo === 'nuevo' ? 'border-espresso bg-espresso text-cream' : 'border-tan/30 text-muted'}`}
        >
          Primera vez
        </button>
        <button
          onClick={() => setModo('codigo')}
          className={`rounded-full border px-4 py-1.5 ${modo === 'codigo' ? 'border-espresso bg-espresso text-cream' : 'border-tan/30 text-muted'}`}
        >
          Ya tengo mi código
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {modo === 'codigo' ? (
        <form onSubmit={ingresarConCodigo} className="mt-6 space-y-3">
          <p className="text-sm text-muted">
            Si ya visitaste la clínica antes, te entregaron un código de cliente en recepción. Ingresa ese código junto a tu teléfono para reservar directo.
          </p>
          <input
            placeholder="Código de cliente (ej. NOVA-4X7K2)"
            value={codigoCliente}
            onChange={(e) => setCodigoCliente(e.target.value)}
            className="w-full rounded border border-tan/30 px-4 py-2"
            required
          />
          <input
            placeholder="Teléfono registrado"
            value={telefonoCliente}
            onChange={(e) => setTelefonoCliente(e.target.value)}
            className="w-full rounded border border-tan/30 px-4 py-2"
            required
          />
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-60"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      ) : (
        <form onSubmit={registrarYContinuar} className="mt-6 space-y-3">
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <input placeholder="Teléfono (con código de país)" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <input placeholder="Carnet de identidad" value={carnet} onChange={(e) => setCarnet(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <input placeholder="Complemento (opcional)" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Expedido (ej. CB)" value={expedido} onChange={(e) => setExpedido(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-60"
          >
            {cargando ? 'Continuando…' : 'Continuar a la reserva'}
          </button>
        </form>
      )}

      <button onClick={() => setStep('horario')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
