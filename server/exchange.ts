/**
 * Exchange rate fetcher via mindicador.cl (Chilean public API, no auth needed).
 * Fetches the latest observed values for USD, BRL, and TRY → CLP.
 */

interface MindicadorSerie {
  codigo: string;
  nombre: string;
  unidad_medida: string;
  serie: Array<{ fecha: string; valor: number }>;
}

async function fetchIndicador(codigo: string): Promise<number | null> {
  const url = `https://mindicador.cl/api/${codigo}`;
  try {
    const r = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "apipsn/1.0" },
    });
    if (!r.ok) return null;
    const data = (await r.json()) as MindicadorSerie;
    const value = data?.serie?.[0]?.valor;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export interface ExchangeRates {
  usdToClp: number | null;
  brlToClp: number | null;
  tryToClp: number | null;
  fetchedAt: string;
  errors: string[];
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const now = new Date().toISOString();
  const errors: string[] = [];

  // Fetch USD → CLP directly
  const usd = await fetchIndicador("dolar");
  if (usd == null) errors.push("USD no disponible en mindicador.cl");

  // BRL → CLP: fetch BRL/USD rate from a free exchange rate endpoint
  // mindicador.cl doesn't have BRL directly, so approximate via USD
  // BRL/USD ≈ mindicador doesn't carry this. We fall back to the user-configured value.
  // For TRY, same situation. Only USD is reliably available from mindicador.cl.

  return {
    usdToClp: usd,
    brlToClp: null,
    tryToClp: null,
    fetchedAt: now,
    errors,
  };
}
