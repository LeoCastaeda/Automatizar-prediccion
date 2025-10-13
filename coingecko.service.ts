import axios from "axios";

export async function getSimplePrice(symbols: string[], vsCurrency: string) {
  const ids = symbols.join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vsCurrency)}`;
  const { data } = await axios.get(url, { timeout: 10_000 });
  return data as Record<string, Record<string, number>>;
}
