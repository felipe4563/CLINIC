'use client';
import { useBooking } from '@/lib/bookingContext';
import StepServicio from './StepServicio';
import StepProfesional from './StepProfesional';
import StepHorario from './StepHorario';

export default function BookingModal() {
  const { isOpen, close, step } = useBooking();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-cream p-8">
        <div className="flex justify-end">
          <button onClick={close} className="text-muted hover:text-ink" aria-label="Cerrar">
            ✕
          </button>
        </div>
        {step === 'servicio' && <StepServicio />}
        {step === 'profesional' && <StepProfesional />}
        {step === 'horario' && <StepHorario />}
        {(step === 'login' || step === 'confirmar' || step === 'pago') && (
          <p className="text-ink">Paso &quot;{step}&quot; pendiente (Task 9).</p>
        )}
      </div>
    </div>
  );
}
