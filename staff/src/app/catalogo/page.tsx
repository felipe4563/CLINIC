'use client';

import { useEffect, useState, useCallback, useMemo, FormEvent } from 'react';
import { api } from '@/lib/api';
import ServicioItem, { type Servicio } from './ServicioItem';
import ProfesionalItem, { type Profesional } from './ProfesionalItem';
import { IconCatalog, IconUserCog } from '@/components/icons';

const VACIO_SERVICIO = { nombre: '', descripcion: '', duracion: '30', precio: '' };
const VACIO_PROFESIONAL = { nombre: '', especialidad: '', fotoUrl: '' };

type ProductoMinimo = { id: number; nombre: string };

export default function CatalogoPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [productos, setProductos] = useState<ProductoMinimo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [qServicio, setQServicio] = useState('');
  const [formServicioAbierto, setFormServicioAbierto] = useState(false);
  const [nuevoServicio, setNuevoServicio] = useState(VACIO_SERVICIO);
  const [guardandoServicio, setGuardandoServicio] = useState(false);

  const [qProfesional, setQProfesional] = useState('');
  const [formProfesionalAbierto, setFormProfesionalAbierto] = useState(false);
  const [nuevoProfesional, setNuevoProfesional] = useState(VACIO_PROFESIONAL);
  const [guardandoProfesional, setGuardandoProfesional] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.getServiciosStaff(), api.getProfesionalesStaff()]);
      setServicios(s);
      setProfesionales(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acceso restringido a Admin');
    }
    try {
      setProductos(await api.getProductos());
    } catch {
      setProductos([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const serviciosFiltrados = useMemo(
    () => servicios.filter((s) => s.nombre.toLowerCase().includes(qServicio.toLowerCase())),
    [servicios, qServicio],
  );
  const profesionalesFiltrados = useMemo(
    () => profesionales.filter((p) => p.nombre.toLowerCase().includes(qProfesional.toLowerCase())),
    [profesionales, qProfesional],
  );

  const serviciosActivos = servicios.filter((s) => s.activo).length;
  const profesionalesActivos = profesionales.filter((p) => p.activo).length;

  async function crearServicio(e: FormEvent) {
    e.preventDefault();
    setGuardandoServicio(true);
    setError(null);
    try {
      await api.crearServicio({
        nombre: nuevoServicio.nombre,
        descripcion: nuevoServicio.descripcion || null,
        duracion_min: Number(nuevoServicio.duracion),
        precio: Number(nuevoServicio.precio),
      });
      setNuevoServicio(VACIO_SERVICIO);
      setFormServicioAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el servicio');
    } finally {
      setGuardandoServicio(false);
    }
  }

  async function crearProfesional(e: FormEvent) {
    e.preventDefault();
    setGuardandoProfesional(true);
    setError(null);
    try {
      await api.crearProfesional({
        nombre: nuevoProfesional.nombre,
        especialidad: nuevoProfesional.especialidad || null,
        foto_url: nuevoProfesional.fotoUrl || null,
      });
      setNuevoProfesional(VACIO_PROFESIONAL);
      setFormProfesionalAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el profesional');
    } finally {
      setGuardandoProfesional(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-semibold">Catálogo</h1>
        <div className="flex gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {serviciosActivos} servicio{serviciosActivos === 1 ? '' : 's'} activo{serviciosActivos === 1 ? '' : 's'}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {profesionalesActivos} profesional{profesionalesActivos === 1 ? '' : 'es'} activo{profesionalesActivos === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <IconCatalog className="h-4 w-4 text-muted-foreground" />
              Servicios
            </h2>
            <button
              onClick={() => setFormServicioAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formServicioAbierto ? 'Cancelar' : '+ Nuevo servicio'}
            </button>
          </div>

          {formServicioAbierto && (
            <form
              onSubmit={crearServicio}
              className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-2"
            >
              <input
                placeholder="Nombre"
                required
                value={nuevoServicio.nombre}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                className="rounded border border-border px-2 py-1.5 sm:col-span-2"
              />
              <textarea
                placeholder="Descripción (opcional)"
                rows={2}
                value={nuevoServicio.descripcion}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, descripcion: e.target.value })}
                className="rounded border border-border px-2 py-1.5 sm:col-span-2"
              />
              <input
                type="number"
                placeholder="Duración (min)"
                required
                value={nuevoServicio.duracion}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, duracion: e.target.value })}
                className="rounded border border-border px-2 py-1.5"
              />
              <input
                type="number"
                placeholder="Precio (Bs)"
                required
                value={nuevoServicio.precio}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
                className="rounded border border-border px-2 py-1.5"
              />
              <button
                type="submit"
                disabled={guardandoServicio}
                className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2"
              >
                {guardandoServicio ? 'Creando…' : 'Crear servicio'}
              </button>
            </form>
          )}

          {servicios.length > 3 && (
            <input
              type="search"
              placeholder="Buscar servicio…"
              value={qServicio}
              onChange={(e) => setQServicio(e.target.value)}
              className="mb-2 w-full rounded border border-border px-2.5 py-1.5 text-sm"
            />
          )}

          <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
            {serviciosFiltrados.map((s) => (
              <ServicioItem key={s.id} servicio={s} todosLosProfesionales={profesionales} todosLosProductos={productos} onChange={cargar} />
            ))}
            {servicios.length === 0 && <p className="text-sm text-muted-foreground">No hay servicios todavía.</p>}
            {servicios.length > 0 && serviciosFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin resultados para &quot;{qServicio}&quot;.</p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <IconUserCog className="h-4 w-4 text-muted-foreground" />
              Profesionales
            </h2>
            <button
              onClick={() => setFormProfesionalAbierto((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft"
            >
              {formProfesionalAbierto ? 'Cancelar' : '+ Nuevo profesional'}
            </button>
          </div>

          {formProfesionalAbierto && (
            <form
              onSubmit={crearProfesional}
              className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-panel p-3 text-sm sm:grid-cols-2"
            >
              <input
                placeholder="Nombre"
                required
                value={nuevoProfesional.nombre}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, nombre: e.target.value })}
                className="rounded border border-border px-2 py-1.5"
              />
              <input
                placeholder="Especialidad"
                value={nuevoProfesional.especialidad}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, especialidad: e.target.value })}
                className="rounded border border-border px-2 py-1.5"
              />
              <input
                placeholder="URL de foto (opcional)"
                value={nuevoProfesional.fotoUrl}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, fotoUrl: e.target.value })}
                className="rounded border border-border px-2 py-1.5 sm:col-span-2"
              />
              <button
                type="submit"
                disabled={guardandoProfesional}
                className="rounded bg-accent px-3 py-1.5 font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2"
              >
                {guardandoProfesional ? 'Creando…' : 'Crear profesional'}
              </button>
            </form>
          )}

          {profesionales.length > 3 && (
            <input
              type="search"
              placeholder="Buscar profesional…"
              value={qProfesional}
              onChange={(e) => setQProfesional(e.target.value)}
              className="mb-2 w-full rounded border border-border px-2.5 py-1.5 text-sm"
            />
          )}

          <div className="grid grid-cols-1 gap-2 2xl:grid-cols-2">
            {profesionalesFiltrados.map((p) => (
              <ProfesionalItem key={p.id} profesional={p} todosLosServicios={servicios} onChange={cargar} />
            ))}
            {profesionales.length === 0 && <p className="text-sm text-muted-foreground">No hay profesionales todavía.</p>}
            {profesionales.length > 0 && profesionalesFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin resultados para &quot;{qProfesional}&quot;.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
