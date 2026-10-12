'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { estadoHttp, mensajeError } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MENSAJE_FORMATO = 'Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB';

export default function StepPagoComprobante() {
  const { config, servicio, profesionalId, servicioId, fecha, horaInicio, porcentaje, setHoraInicio, setCitaId, setPago, setStep } = useBooking();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [horarioOcupado, setHorarioOcupado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const precio = servicio?.precio ? Number(servicio.precio) : 0;
  const monto = Math.round(precio * (porcentaje / 100) * 100) / 100;
  const qrSrc = config?.qr_fijo_url ? `${API_URL}${config.qr_fijo_url}` : null;

  useEffect(() => {
    if (!archivo || !archivo.type.startsWith('image/')) return;
    const url = URL.createObjectURL(archivo);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVistaPrevia(url);
    return () => {
      URL.revokeObjectURL(url);
      setVistaPrevia(null);
    };
  }, [archivo]);

  function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    const elegido = e.target.files?.[0] ?? null;
    if (elegido && (!TIPOS.includes(elegido.type) || elegido.size > MAX_BYTES)) {
      setArchivo(null);
      setError(MENSAJE_FORMATO);
      e.target.value = '';
      return;
    }
    setArchivo(elegido);
  }

  async function enviar() {
    if (!archivo || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const { cita, pago } = await api.crearCitaConComprobante(
        { profesionalId, servicioId, fecha, horaInicio, porcentajePago: porcentaje },
        archivo,
      );
      setCitaId(cita.id);
      setPago(pago);
      setStep('confirmada');
    } catch (e: unknown) {
      setHorarioOcupado(estadoHttp(e) === 409);
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  function elegirOtroHorario() {
    setHoraInicio(null);
    setStep('horario');
  }

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">Paga Bs. {monto} escaneando este QR</h3>
      {qrSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrSrc} alt="QR de pago de la clínica" className="mx-auto mt-6 w-64 max-w-full rounded border border-tan/30" />
      ) : (
        <p className="mt-6 text-sm text-red-600">La clínica todavía no cargó su QR. Escríbenos por WhatsApp para reservar.</p>
      )}
      {config?.qr_fijo_datos && <p className="mt-3 text-sm text-muted">{config.qr_fijo_datos}</p>}
      {porcentaje === 50 && (
        <p className="mt-2 text-sm text-muted">Esto es tu seña del 50%. El saldo de Bs. {Math.round((precio - monto) * 100) / 100} se paga en la clínica el día de tu cita.</p>
      )}

      <label className="mt-6 block text-left text-sm text-ink">
        <span className="text-xs uppercase tracking-widest text-muted">Comprobante de pago</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={elegirArchivo}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-espresso file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-cream"
        />
      </label>
      {vistaPrevia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vistaPrevia} alt="Vista previa del comprobante" className="mx-auto mt-4 max-h-48 max-w-full rounded border border-tan/30" />
      )}
      {archivo && !vistaPrevia && <p className="mt-3 text-sm text-muted">{archivo.name}</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {horarioOcupado ? (
        <button onClick={elegirOtroHorario} className="mt-6 w-full rounded-full bg-espresso px-6 py-3 text-xs uppercase tracking-widest text-cream">
          Elegir otro horario
        </button>
      ) : (
        <button
          onClick={enviar}
          disabled={!archivo || !qrSrc || enviando}
          className="mt-6 w-full rounded-full bg-espresso px-6 py-3 text-xs uppercase tracking-widest text-cream disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Enviar reserva'}
        </button>
      )}
    </div>
  );
}
