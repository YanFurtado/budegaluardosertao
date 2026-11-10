import { useEffect, useState } from "react";

/** Data/hora atual, atualizada a cada minuto (para o aviso de aberto/fechado). */
export function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}
