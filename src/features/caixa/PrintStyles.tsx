/**
 * Ao imprimir, mostra só o elemento marcado com `data-print-area`
 * (ex.: o painel lateral com o relatório) e esconde o resto da página.
 */
export function PrintStyles() {
  return (
    <style>{`
      @media print {
        body > *:not(:has([data-print-area])) { display: none !important; }
        :has(> [data-print-area]) > :not([data-print-area]) { display: none !important; }
        [data-print-area] {
          position: static !important;
          inset: auto !important;
          transform: none !important;
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          border: none !important;
          box-shadow: none !important;
          animation: none !important;
        }
        [data-print-area] * { overflow: visible !important; max-height: none !important; }
        [data-print-area] .print-hide { display: none !important; }
      }
    `}</style>
  );
}
