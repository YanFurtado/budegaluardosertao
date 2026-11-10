import { create } from "zustand";

/** Estado de interface que NÃO é salvo (o navegador exige um clique para liberar o som a cada visita). */
interface UiState {
  somAtivo: boolean;
  setSomAtivo: (v: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  somAtivo: false,
  setSomAtivo: (somAtivo) => set({ somAtivo }),
}));
