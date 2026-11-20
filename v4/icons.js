// Iconos de línea propios (24×24, trazo 1.6) para secciones, ejercicios y herramientas.
const P = {
  // secciones
  info: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 14.5h18M8 5v14M13 5v14"/><circle cx="10.5" cy="12.2" r="1.3" class="f"/><circle cx="15.5" cy="16.8" r="1.3" class="f"/>',
  teoria: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="M9 10l10-2"/>',
  tecnica: '<path d="M8.5 20h7L13 4h-2z"/><path d="M12 15.5 16.5 7"/><circle cx="16.8" cy="6.5" r="1.2" class="f"/><path d="M9.6 16.5h4.8"/>',
  // teoría
  intervalos: '<circle cx="6" cy="17" r="2.4"/><circle cx="18" cy="7" r="2.4"/><path d="M8 15.5 16 8.5" stroke-dasharray="2 2.6"/><path d="M4 21h4M16 3h4"/>',
  escalas: '<circle cx="4.5" cy="19" r="1.8"/><circle cx="9.5" cy="15" r="1.8"/><circle cx="14.5" cy="11" r="1.8"/><circle cx="19.5" cy="7" r="1.8" class="f"/><path d="M3 22h18" opacity=".35"/>',
  acordes: '<circle cx="12" cy="6" r="2.4"/><circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="18" r="2.4" class="f"/><path d="M5 3v18M19 3v18" opacity=".35"/>',
  grados: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v2.4M19.4 8l-2 1.2M19.4 16l-2-1.2M12 20.5v-2.4M4.6 16l2-1.2M4.6 8l2 1.2"/><circle cx="12" cy="12" r="1.6" class="f"/>',
  'oido-funcional': '<path d="M7 9.5a5 5 0 0 1 10 0c0 3-3 3.6-3 6.5a2.5 2.5 0 0 1-4.6 1.3"/><path d="M10 9.8a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.2"/><path d="M19.5 6.5a8 8 0 0 1 0 7" opacity=".5"/>',
  funciones: '<circle cx="5" cy="12" r="2.3"/><circle cx="12" cy="5" r="2.3"/><circle cx="19" cy="12" r="2.3" class="f"/><path d="M6.6 10.2 10.3 6.7M13.7 6.7l3.7 3.5M17 13.8c-2.8 3.5-7.2 3.5-10 0"/>',
  extensiones: '<rect x="5" y="15" width="14" height="4" rx="1.2"/><rect x="5" y="9.5" width="14" height="4" rx="1.2" opacity=".6"/><path d="M12 2.5v5M9.5 5h5"/>',
  secundarios: '<circle cx="18" cy="17" r="2.6" class="f"/><path d="M4 7c5 0 9 2 11.6 7.8"/><path d="m16.6 10.6-.9 4.3-4-1.6"/><circle cx="4" cy="7" r="1.4"/>',
  tritono: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="3.5" r="1.6" class="f"/><circle cx="12" cy="20.5" r="1.6" class="f"/><path d="M12 6.5v11M9.5 9 12 6.5 14.5 9M9.5 15l2.5 2.5 2.5-2.5"/>',
  intercambio: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><path d="M12 9v6" opacity=".5"/>',
  impro: '<path d="M2.5 14c2-5 4-5 6 0s4 5 6 0 4-5 6 0"/><path d="M18.5 3.5v3M17 5h3M5 18.5v2M4 19.5h2"/>',
  // técnica
  metronomo: '<path d="M8 21h8l-2.7-17h-2.6z"/><path d="M12 16 17 6.5"/><path d="M9.2 13.5h5.6" opacity=".5"/><circle cx="12" cy="16" r="1.2" class="f"/>',
  'acorde-escalas': '<rect x="3" y="9" width="5" height="11" rx="1.2"/><path d="M11 18l3-3 3 2 4-6"/><circle cx="21" cy="11" r="1.2" class="f"/><path d="M3 13h5M3 16.5h5" opacity=".5"/>',
  'acorde-arpegios': '<rect x="3" y="9" width="5" height="11" rx="1.2"/><circle cx="12" cy="17.5" r="1.7"/><circle cx="16" cy="13" r="1.7"/><circle cx="20" cy="8.5" r="1.7" class="f"/><path d="M3 13h5M3 16.5h5" opacity=".5"/>',
  ejercicios: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.3" class="f"/><path d="m15 9 5-5M17 4h3v3"/>',
  acordes2: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 7.5h14M5 12h14M5 16.5h14M9.7 3v18M14.3 3v18"/><circle cx="9.7" cy="9.7" r="1.5" class="f"/><circle cx="14.3" cy="14.2" r="1.5" class="f"/>',
};
export function icon(id, cls = '') {
  const body = P[id] || P.teoria;
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
