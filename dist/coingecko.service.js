import axios from "axios";
export async function getHistoricalData(coinId, days = 7, vsCurrency = "usd") {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
    const { data } = await axios.get(url, { timeout: 10_000 });
    return data;
}
// Tu función existente
export async function getSimplePrice(symbols, vsCurrency) {
    const ids = symbols.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vsCurrency)}`;
    const { data } = await axios.get(url, { timeout: 10_000 });
    return data;
}
