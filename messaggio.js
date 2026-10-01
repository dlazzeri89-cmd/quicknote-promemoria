// messaggio.js — specchio di ntfy_client.costruisci_messaggio e di orari.scelte_rapide.
// tests/test_pagina.py confronta l'uscita con quella Python: se cambi uno, cambia l'altro.
export const URL = "https://ntfy.sh";
export const LIVELLI_RINVIO = 2;
export const MAX_CODA_S = 3 * 24 * 3600 - 600;

export function linkPagina(pagina, canale, canaleServizio, seq, titolo) {
  const parti = [["c", canale], ["s", canaleServizio], ["q", seq], ["t", titolo]]
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return `${pagina}#${parti.join("&")}`;
}

export function costruisciMessaggio(canale, canaleServizio, pagina, seq, titolo,
                                    ritardo = null, livelli = LIVELLI_RINVIO) {
  const link = linkPagina(pagina, canale, canaleServizio, seq, titolo);
  const m = { topic: canale, title: titolo, message: "QuickNote", sequence_id: seq, click: link };
  if (ritardo !== null) m.delay = String(ritardo);
  const azioni = [{ action: "http", label: "Fatto", method: "GET",
                    url: `${URL}/${canale}/${seq}/delete`, clear: true }];
  if (livelli > 0) {
    const dopo = costruisciMessaggio(canale, canaleServizio, pagina, seq, titolo, "3h", livelli - 1);
    azioni.push({ action: "http", label: "Tra 3 ore", method: "POST", url: URL,
                  body: JSON.stringify(dopo), clear: true });
  }
  azioni.push({ action: "view", label: "Altro…", url: link, clear: true });
  m.actions = azioni;
  return m;
}

function alle(giorno, ora) { const d = new Date(giorno); d.setHours(ora, 0, 0, 0); return d; }
function piuGiorni(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function scelteRapide(adesso) {
  const tre = new Date(adesso);
  tre.setSeconds(0, 0);
  tre.setHours(tre.getHours() + 3);
  const scelte = [["Tra 3 ore", tre]];
  const sera = alle(adesso, 18);
  if (adesso < sera) scelte.push(["Stasera 18:00", sera]);
  scelte.push(["Domani 9:00", alle(piuGiorni(adesso, 1), 9)]);
  const lunediZero = (adesso.getDay() + 6) % 7;          // 0 = lunedì, come weekday() in Python
  scelte.push(["Lunedì 9:00", alle(piuGiorni(adesso, (7 - lunediZero) % 7 || 7), 9)]);
  return scelte;
}
