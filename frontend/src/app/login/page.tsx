'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/mis-citas';
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [carnetIdentidad, setCarnetIdentidad] = useState('');
  const [carnetComplemento, setCarnetComplemento] = useState('');
  const [carnetExpedido, setCarnetExpedido] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviarOtp() {
    try {
      await api.requestOtp(telefono, nombre, carnetIdentidad, carnetComplemento, carnetExpedido);
      setEnviado(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verificar() {
    try {
      const { token } = await api.verifyOtp(telefono, codigo);
      api.setToken(token);
      router.push(next);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main>
      <h1>Ingresar</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!enviado ? (
        <>
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input placeholder="Telefono (con codigo de pais)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <input
            placeholder="Carnet de identidad"
            value={carnetIdentidad}
            onChange={(e) => setCarnetIdentidad(e.target.value)}
            required
          />
          <input
            placeholder="Complemento (opcional)"
            value={carnetComplemento}
            onChange={(e) => setCarnetComplemento(e.target.value)}
          />
          <input
            placeholder="Expedido (ej. LP)"
            value={carnetExpedido}
            onChange={(e) => setCarnetExpedido(e.target.value)}
            required
          />
          <button onClick={enviarOtp}>Enviar codigo por WhatsApp</button>
        </>
      ) : (
        <>
          <input placeholder="Codigo recibido" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <button onClick={verificar}>Verificar</button>
        </>
      )}
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
