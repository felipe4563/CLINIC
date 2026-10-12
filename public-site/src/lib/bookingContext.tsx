'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Servicio, Profesional, Pago, ConfiguracionPublica } from './types';

type Step = 'servicio' | 'profesional' | 'horario' | 'login' | 'confirmar' | 'pago' | 'confirmada';

interface BookingState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  step: Step;
  setStep: (s: Step) => void;
  servicioId: number | null;
  setServicioId: (id: number | null) => void;
  servicio: Servicio | null;
  setServicio: (s: Servicio | null) => void;
  profesionalId: number | null;
  setProfesionalId: (id: number | null) => void;
  profesional: Profesional | null;
  setProfesional: (p: Profesional | null) => void;
  fecha: string;
  setFecha: (f: string) => void;
  horaInicio: string | null;
  setHoraInicio: (h: string | null) => void;
  citaId: number | null;
  setCitaId: (id: number | null) => void;
  pago: Pago | null;
  setPago: (p: Pago | null) => void;
  config: ConfiguracionPublica | null;
  setConfig: (c: ConfiguracionPublica | null) => void;
  porcentaje: 50 | 100;
  setPorcentaje: (p: 50 | 100) => void;
  aceptaPolitica: boolean;
  setAceptaPolitica: (v: boolean) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('servicio');
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [citaId, setCitaId] = useState<number | null>(null);
  const [pago, setPago] = useState<Pago | null>(null);
  const [config, setConfig] = useState<ConfiguracionPublica | null>(null);
  const [porcentaje, setPorcentaje] = useState<50 | 100>(100);
  const [aceptaPolitica, setAceptaPolitica] = useState(false);

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
    setPorcentaje(100);
    setAceptaPolitica(false);
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false);
  }

  return (
    <BookingContext.Provider
      value={{ isOpen, open, close, step, setStep, servicioId, setServicioId, servicio, setServicio, profesionalId, setProfesionalId, profesional, setProfesional, fecha, setFecha, horaInicio, setHoraInicio, citaId, setCitaId, pago, setPago, config, setConfig, porcentaje, setPorcentaje, aceptaPolitica, setAceptaPolitica }}
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
