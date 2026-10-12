import { useEffect, useState } from 'react';
import { INTERNAL_EMAIL, internalSupabase } from '../../lib/internal-supabase.js';

function loginError(error) {
  if (error?.status === 429) return 'Hubo demasiados intentos. Espera un momento antes de volver a intentarlo.';
  if (error?.code === 'invalid_credentials') return 'El código no es correcto. Inténtalo de nuevo.';
  return 'No pudimos verificar el acceso. Inténtalo de nuevo en un momento.';
}

export default function useInternalAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!internalSupabase) {
      setChecking(false);
      setError('El acceso interno no está disponible en este momento.');
      return;
    }

    let active = true;
    let revision = 0;
    const { data: { subscription } } = internalSupabase.auth.onAuthStateChange((event, session) => {
      const current = ++revision;
      if (!session) {
        setUser(null);
        setChecking(false);
        return;
      }
      if (event === 'INITIAL_SESSION') setChecking(true);

      // Validate with Auth; a value inserted into browser storage cannot unlock data.
      queueMicrotask(async () => {
        try {
          const { data, error: authError } = await internalSupabase.auth.getUser(session.access_token);
          if (!active || current !== revision) return;
          if (authError || data.user?.app_metadata?.apaqro_role !== 'team') {
            setUser(null);
            setError('Este acceso no tiene permiso para entrar al área interna.');
          } else {
            setUser(data.user);
            setError('');
          }
        } catch {
          if (active && current === revision) {
            setUser(null);
            setError('No pudimos verificar la sesión. Vuelve a ingresar tu código.');
          }
        } finally {
          if (active && current === revision) setChecking(false);
        }
      });
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(code) {
    setError('');
    if (!internalSupabase) {
      setError('El acceso interno no está disponible en este momento.');
      return false;
    }
    try {
      const { data, error: authError } = await internalSupabase.auth.signInWithPassword({ email: INTERNAL_EMAIL, password: code });
      if (authError) { setError(loginError(authError)); return false; }
      if (data.user?.app_metadata?.apaqro_role !== 'team') {
        await internalSupabase.auth.signOut({ scope: 'local' });
        setError('Este acceso no tiene permiso para entrar al área interna.');
        return false;
      }
      return true;
    } catch {
      setError(loginError());
      return false;
    }
  }

  async function signOut() {
    setError('');
    try {
      const { error: authError } = await internalSupabase.auth.signOut({ scope: 'local' });
      if (authError) throw authError;
      setUser(null);
    } catch {
      setError('No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.');
    }
  }

  return { user, checking, error, signIn, signOut };
}
