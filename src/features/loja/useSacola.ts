import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Sacola do cliente na página da loja: { id do produto: quantidade }. Fica só neste aparelho. */
interface SacolaState {
  itens: Record<string, number>;
  alterar: (produtoId: string, delta: number) => void;
  remover: (produtoIds: string[]) => void;
}

export const useSacola = create<SacolaState>()(
  persist(
    (set) => ({
      itens: {},
      alterar: (id, delta) =>
        set((s) => {
          const itens = { ...s.itens };
          const q = Math.min(99, (itens[id] ?? 0) + delta);
          if (q <= 0) delete itens[id];
          else itens[id] = q;
          return { itens };
        }),
      remover: (ids) =>
        set((s) => {
          const itens = { ...s.itens };
          ids.forEach((id) => delete itens[id]);
          return { itens };
        }),
    }),
    { name: "budega:sacola", version: 1, storage: createJSONStorage(() => localStorage), partialize: (s) => ({ itens: s.itens }) },
  ),
);
