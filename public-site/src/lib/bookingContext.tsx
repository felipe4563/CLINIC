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
  servicio: any | null;
  setServicio: (s: any | null) => void;
  profesionalId: number | null;
  setProfesionalId: (id: number | null) => void;
  profesional: any | null;
  setProfesional: (p: any | null) => void;
  fecha: string;
  setFecha: (f: string) => void;
  horaInicio: string | null;
  setHoraInicio: (h: string | null) => void;
  citaId: number | null;
  setCitaId: (id: number | null) => void;
  pago: any | null;
  setPago: (p: any | null) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('servicio');
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [servicio, setServicio] = useState<any | null>(null);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);
  const [profesional, setProfesional] = useState<any | null>(null);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [citaId, setCitaId] = useState<number | null>(null);
  const [pago, setPago] = useState<any | null>(null);

  function open() {
    setStep('servicio');
    setServicioId(null);
    setServicio(null);
    setProfesionalId(null);
    setProfesional(null);
    setFecha('');
    setHoraInicio(null);
    setCitaId(null);
    setPago(null);
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false);
  }

  return (
    <BookingContext.Provider
      value={{ isOpen, open, close, step, setStep, servicioId, setServicioId, servicio, setServicio, profesionalId, setProfesionalId, profesional, setProfesional, fecha, setFecha, horaInicio, setHoraInicio, citaId, setCitaId, pago, setPago }}
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
