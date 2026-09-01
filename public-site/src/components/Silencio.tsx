export default function Silencio() {
  return (
    <section className="relative flex h-[70vh] items-center justify-center bg-espresso text-cream text-center">
      {/* PLACEHOLDER: replace with real full-bleed photo of the treatment box */}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/70 to-espresso/40" />
      <div className="relative z-10 px-6">
        <h2 className="font-serif text-6xl md:text-7xl">Silencio</h2>
        <p className="mt-4 text-cream/80">El primer tratamiento comienza antes de entrar al box</p>
      </div>
    </section>
  );
}
