'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Step = 'servicio' | 'profesional' | 'horario' | 'login' | 'confirmar' | 'pago';

interface BookingState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  step: Step;
  setStep: (s: Step) => void;
  servicioId: number | null;
  setServicioId: (id: number | null) => void;
  profesionalId: number | null;
  setProfesionalId: (id: number | null) => void;
  fecha: string;
  setFecha: (f: string) => void;
  horaInicio: string | null;
  setHoraInicio: (h: string | null) => void;
  citaId: number | null;
  setCitaId: (id: number | null) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('servicio');
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [citaId, setCitaId] = useState<number | null>(null);

  function open() {
    setStep('servicio');
    setServicioId(null);
    setProfesionalId(null);
    setFecha('');
    setHoraInicio(null);
    setCitaId(null);
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false);
  }

  return (
    <BookingContext.Provider
      value={{ isOpen, open, close, step, setStep, servicioId, setServicioId, profesionalId, setProfesionalId, fecha, setFecha, horaInicio, setHoraInicio, citaId, setCitaId }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
