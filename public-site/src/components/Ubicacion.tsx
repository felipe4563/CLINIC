export default function Ubicacion() {
  const direccion = 'Edificio Vedra planta baja, calle Lanza No 670 entre Chuquisaca y Av. Salamanca, Cochabamba, Bolivia';
  const mapsQuery = encodeURIComponent(direccion);

  return (
    <section id="ubicacion" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-5xl text-espresso">Consultorio</h2>

          <div className="mt-10 space-y-2 text-sm text-ink">
            <p>{direccion}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs tracking-widest uppercase text-tan"
            >
              Abrir en Google Maps
            </a>
          </div>

          <div className="mt-8 space-y-2 text-sm text-ink">
            <p>+591 65359810</p>
            <p>info@novaged.com</p>
          </div>

          <div className="mt-8 border-t border-tan/20 pt-6 text-sm text-muted">
            <p className="text-xs tracking-widest uppercase text-muted">Horarios de atención</p>
            <p className="mt-2">Lunes a viernes 09:00 - 13:00</p>
            <p>14:00 - 20:00</p>
            <p>Sábado 09:00 - 16:00</p>
          </div>
        </div>

        <div className="aspect-[4/3] w-full overflow-hidden rounded-sm">
          <iframe
            title="Ubicación Clinic NovagED"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
