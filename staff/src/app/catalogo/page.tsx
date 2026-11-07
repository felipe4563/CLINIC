'use client';

import { Suspense, useEffect, useState, useCallback, useMemo, FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ServicioItem, { type Servicio } from './ServicioItem';
import ProfesionalItem, { type Profesional } from './ProfesionalItem';
import type { ProductoInventario } from './ProductosServicioModal';
import CategoriaServicio, { SIN_ESPECIALIDAD, type Especialidad } from './CategoriaServicio';
import { IconCatalog, IconUserCog } from '@/components/icons';

const VACIO_SERVICIO = { nombre: '', descripcion: '', especialidad: '', grupo: '', duracion: '30', precio: '' };
const VACIO_PROFESIONAL = { nombre: '', especialidad: '', registro: '' };

// Servicios y Profesionales en pestañas: los profesionales quedaban al fondo, debajo
// de todos los servicios. La pestaña va en la dirección (?tab=profesionales).
type Pestana = 'servicios' | 'profesionales';

export default function CatalogoPage() {
  return (
    <Suspense>
      <Catalogo />
    </Suspense>
  );
}

function Catalogo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Pestana = searchParams.get('tab') === 'profesionales' ? 'profesionales' : 'servicios';

  function cambiarTab(nueva: Pestana) {
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'servicios') params.delete('tab');
    else params.set('tab', nueva);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
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
    try {
      setEspecialidades(await api.getCategoriasServicio());
    } catch {
      setEspecialidades([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const especialidadDe = (s: Servicio) => s.especialidad || SIN_ESPECIALIDAD;
  const serviciosFiltrados = useMemo(() => {
    const q = qServicio.toLowerCase();
    return servicios.filter(
      (s) =>
        (!filtroEspecialidad || (s.especialidad || SIN_ESPECIALIDAD) === filtroEspecialidad) &&
        `${s.nombre} ${s.especialidad ?? ''} ${s.grupo ?? ''}`.toLowerCase().includes(q),
    );
  }, [servicios, qServicio, filtroEspecialidad]);
  // Agrupados por especialidad, en el orden de la carta; los que no tienen, al final.
  const ordenEspecialidades = [...especialidades.map((e) => e.nombre), SIN_ESPECIALIDAD];
  const conteoPorEspecialidad = ordenEspecialidades
    .map((nombre) => [nombre, servicios.filter((s) => especialidadDe(s) === nombre).length] as const)
    .filter(([, n]) => n > 0);
  const secciones = ordenEspecialidades
    .map((nombre) => ({ nombre, lista: serviciosFiltrados.filter((s) => especialidadDe(s) === nombre) }))
    .filter((sec) => sec.lista.length > 0);
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
        especialidad: nuevoServicio.especialidad,
        grupo: nuevoServicio.grupo || null,
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
        registro_profesional: nuevoProfesional.registro || null,
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
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconCatalog className="h-5 w-5 text-muted-foreground" />
          Catálogo
        </h1>
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

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {(
          [
            ['servicios', 'Servicios', servicios.length],
            ['profesionales', 'Profesionales', profesionales.length],
          ] as const
        ).map(([clave, texto, cantidad]) => (
          <button
            key={clave}
            role="tab"
            aria-selected={tab === clave}
            onClick={() => cambiarTab(clave)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${tab === clave ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            {clave === 'servicios' ? <IconCatalog className="h-4 w-4" /> : <IconUserCog className="h-4 w-4" />}
            {texto}
            <span className="text-xs font-normal text-muted-foreground">({cantidad})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {tab === 'servicios' && (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <IconCatalog className="h-4 w-4 text-muted-foreground" />
              Servicios ofrecidos
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
              <CategoriaServicio
                especialidades={especialidades}
                especialidad={nuevoServicio.especialidad}
                grupo={nuevoServicio.grupo}
                onCambio={(especialidad, grupo) => setNuevoServicio((n) => ({ ...n, especialidad, grupo }))}
                onEspecialidades={setEspecialidades}
                className="sm:col-span-2"
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

          {conteoPorEspecialidad.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[['', 'Todas', servicios.length] as const, ...conteoPorEspecialidad.map(([nombre, n]) => [nombre, nombre, n] as const)].map(
                ([valor, texto, n]) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => setFiltroEspecialidad(valor)}
                    aria-pressed={filtroEspecialidad === valor}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      filtroEspecialidad === valor ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'
                    }`}
                  >
                    {texto} <span className="opacity-70">({n})</span>
                  </button>
                ),
              )}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {secciones.map((sec) => (
              <div key={sec.nombre}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {sec.nombre} <span className="font-normal">({sec.lista.length})</span>
                </h3>
                <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
                  {sec.lista.map((s) => (
                    <ServicioItem
                      key={s.id}
                      servicio={s}
                      todosLosProfesionales={profesionales}
                      todosLosProductos={productos}
                      especialidades={especialidades}
                      onEspecialidades={setEspecialidades}
                      onChange={cargar}
                    />
                  ))}
                </div>
              </div>
            ))}
            {servicios.length === 0 && <p className="text-sm text-muted-foreground">No hay servicios todavía.</p>}
            {servicios.length > 0 && serviciosFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin resultados{qServicio ? <> para &quot;{qServicio}&quot;</> : null}.</p>
            )}
          </div>
        </section>
        )}

        {tab === 'profesionales' && (
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
                placeholder="Registro profesional (sale en el consentimiento)"
                value={nuevoProfesional.registro}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, registro: e.target.value })}
                className="rounded border border-border px-2 py-1.5 sm:col-span-2"
              />
              <p className="text-xs text-muted-foreground sm:col-span-2">La foto, la biografía y lo que sale en la web se cargan después en «Perfil web».</p>
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

          <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {profesionalesFiltrados.map((p) => (
              <ProfesionalItem key={p.id} profesional={p} todosLosServicios={servicios} onChange={cargar} />
            ))}
            {profesionales.length === 0 && <p className="text-sm text-muted-foreground">No hay profesionales todavía.</p>}
            {profesionales.length > 0 && profesionalesFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin resultados para &quot;{qProfesional}&quot;.</p>
            )}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
