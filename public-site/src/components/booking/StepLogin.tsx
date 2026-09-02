'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepLogin() {
  const { setStep } = useBooking();
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [carnet, setCarnet] = useState('');
  const [complemento, setComplemento] = useState('');
  const [expedido, setExpedido] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviarOtp() {
    setError('');
    try {
      await api.requestOtp(telefono, nombre, carnet, complemento, expedido);
      setEnviado(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verificar() {
    setError('');
    try {
      const { token } = await api.verifyOtp(telefono, codigo);
      api.setToken(token);
      setStep('confirmar');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Ingresa tus datos</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!enviado ? (
        <div className="mt-6 space-y-3">
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Teléfono (con código de país)" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Carnet de identidad" value={carnet} onChange={(e) => setCarnet(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <input placeholder="Complemento (opcional)" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Expedido (ej. CB)" value={expedido} onChange={(e) => setExpedido(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <button onClick={enviarOtp} className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
            Enviar código por WhatsApp
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <input placeholder="Código recibido" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <button onClick={verificar} className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
            Verificar
          </button>
        </div>
      )}
      <button onClick={() => setStep('horario')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
