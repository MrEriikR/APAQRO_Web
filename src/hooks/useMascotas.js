import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

const columns = 'id,nombre,sexo,fecha_ingreso,edad_al_ingreso,fecha_nacimiento_estimada,convive_con,observaciones,temperamento,nivel_energia,estatus,foto,ficha,created_at,especie';
const pageSize = 500;

export default function useMascotas(client = supabase) {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    async function load() {
      try {
        if (!client) throw new Error('Supabase no está configurado.');
        const records = [];
        let offset = 0;
        let more = true;

        while (more) {
          const { data, error: queryError } = await client
            .from('mascotas')
            .select(columns)
            .order('nombre', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + pageSize - 1)
            .abortSignal(controller.signal);

          if (queryError) throw queryError;
          records.push(...(data || []));
          more = data?.length === pageSize;
          offset += pageSize;
        }

        if (active) {
          setMascotas(records);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt, client]);

  function retry() {
    setLoading(true);
    setError(false);
    setAttempt((value) => value + 1);
  }

  return { mascotas, loading, error, retry };
}
