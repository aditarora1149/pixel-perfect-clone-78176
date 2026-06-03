// Curated stock universe seeds — used as the screener's starting point.
// Live quote/fundamental data is fetched on demand from Yahoo Finance.
// Source labels are surfaced in the UI so users always know what's authoritative.

export type Market = "IN" | "US";

export type UniverseEntry = {
  symbol: string;       // Yahoo-compatible ticker (e.g. RELIANCE.NS, AAPL)
  name: string;
  sector: string;
  industry: string;
  market: Market;
  exchange: "NSE" | "BSE" | "NYSE" | "NASDAQ";
};

// Top-of-market sample. The screener treats this as the starting "universe".
// In production you'd ship the full Nifty 500 / S&P 500 JSON; this curated
// list keeps the bundle lean and demonstrates the full pipeline.

export const UNIVERSE_IN: UniverseEntry[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", industry: "Oil & Gas Refining", market: "IN", exchange: "NSE" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "Technology", industry: "IT Services", market: "IN", exchange: "NSE" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "INFY.NS", name: "Infosys", sector: "Technology", industry: "IT Services", market: "IN", exchange: "NSE" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Communication Services", industry: "Telecom", market: "IN", exchange: "NSE" },
  { symbol: "ITC.NS", name: "ITC", sector: "Consumer Staples", industry: "Tobacco & FMCG", market: "IN", exchange: "NSE" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Industrials", industry: "Construction & Engineering", market: "IN", exchange: "NSE" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "Consumer Staples", industry: "Household Products", market: "IN", exchange: "NSE" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financials", industry: "NBFC", market: "IN", exchange: "NSE" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Materials", industry: "Specialty Chemicals", market: "IN", exchange: "NSE" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Consumer Discretionary", industry: "Automobiles", market: "IN", exchange: "NSE" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer Discretionary", industry: "Jewellery & Watches", market: "IN", exchange: "NSE" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Health Care", industry: "Pharma", market: "IN", exchange: "NSE" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "Technology", industry: "IT Services", market: "IN", exchange: "NSE" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "Technology", industry: "IT Services", market: "IN", exchange: "NSE" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Materials", industry: "Cement", market: "IN", exchange: "NSE" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "Consumer Staples", industry: "Packaged Foods", market: "IN", exchange: "NSE" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Consumer Discretionary", industry: "Automobiles", market: "IN", exchange: "NSE" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Materials", industry: "Metals", market: "IN", exchange: "NSE" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", sector: "Utilities", industry: "Electric Utilities", market: "IN", exchange: "NSE" },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Utilities", industry: "Electric Utilities", market: "IN", exchange: "NSE" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy", industry: "Oil & Gas E&P", market: "IN", exchange: "NSE" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Industrials", industry: "Trading Companies", market: "IN", exchange: "NSE" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Materials", industry: "Metals", market: "IN", exchange: "NSE" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Labs", sector: "Health Care", industry: "Pharma", market: "IN", exchange: "NSE" },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Health Care", industry: "Pharma", market: "IN", exchange: "NSE" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financials", industry: "Diversified Financials", market: "IN", exchange: "NSE" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "Technology", industry: "IT Services", market: "IN", exchange: "NSE" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Financials", industry: "Banks", market: "IN", exchange: "NSE" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Materials", industry: "Diversified", market: "IN", exchange: "NSE" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Consumer Discretionary", industry: "Two-Wheelers", market: "IN", exchange: "NSE" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Consumer Discretionary", industry: "Automobiles", market: "IN", exchange: "NSE" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Health Care", industry: "Pharma", market: "IN", exchange: "NSE" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "Consumer Staples", industry: "Packaged Foods", market: "IN", exchange: "NSE" },
  { symbol: "PIDILITIND.NS", name: "Pidilite Industries", sector: "Materials", industry: "Specialty Chemicals", market: "IN", exchange: "NSE" },
  { symbol: "DMART.NS", name: "Avenue Supermarts", sector: "Consumer Staples", industry: "Retail", market: "IN", exchange: "NSE" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Financials", industry: "Insurance", market: "IN", exchange: "NSE" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", sector: "Financials", industry: "Insurance", market: "IN", exchange: "NSE" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", sector: "Industrials", industry: "Transportation", market: "IN", exchange: "NSE" },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Energy", industry: "Coal", market: "IN", exchange: "NSE" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy", industry: "Refining", market: "IN", exchange: "NSE" },
  { symbol: "IOC.NS", name: "Indian Oil Corp", sector: "Energy", industry: "Refining", market: "IN", exchange: "NSE" },
  { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance", sector: "Financials", industry: "NBFC", market: "IN", exchange: "NSE" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", sector: "Consumer Staples", industry: "Beverages", market: "IN", exchange: "NSE" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Health Care", industry: "Hospitals", market: "IN", exchange: "NSE" },
  { symbol: "TRENT.NS", name: "Trent", sector: "Consumer Discretionary", industry: "Retail", market: "IN", exchange: "NSE" },
];

export const UNIVERSE_US: UniverseEntry[] = [
  { symbol: "AAPL", name: "Apple", sector: "Technology", industry: "Consumer Electronics", market: "US", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", industry: "Software", market: "US", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", industry: "Semiconductors", market: "US", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet (Class A)", sector: "Communication Services", industry: "Internet", market: "US", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer Discretionary", industry: "Internet Retail", market: "US", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", sector: "Communication Services", industry: "Internet", market: "US", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla", sector: "Consumer Discretionary", industry: "Auto Manufacturers", market: "US", exchange: "NASDAQ" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", sector: "Financials", industry: "Diversified", market: "US", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", industry: "Banks", market: "US", exchange: "NYSE" },
  { symbol: "V", name: "Visa", sector: "Financials", industry: "Payments", market: "US", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard", sector: "Financials", industry: "Payments", market: "US", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Health Care", industry: "Managed Care", market: "US", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Health Care", industry: "Pharma", market: "US", exchange: "NYSE" },
  { symbol: "LLY", name: "Eli Lilly", sector: "Health Care", industry: "Pharma", market: "US", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", industry: "Oil & Gas", market: "US", exchange: "NYSE" },
  { symbol: "CVX", name: "Chevron", sector: "Energy", industry: "Oil & Gas", market: "US", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", industry: "Household Products", market: "US", exchange: "NYSE" },
  { symbol: "KO", name: "Coca-Cola", sector: "Consumer Staples", industry: "Beverages", market: "US", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo", sector: "Consumer Staples", industry: "Beverages", market: "US", exchange: "NASDAQ" },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Staples", industry: "Retail", market: "US", exchange: "NASDAQ" },
  { symbol: "WMT", name: "Walmart", sector: "Consumer Staples", industry: "Retail", market: "US", exchange: "NYSE" },
  { symbol: "HD", name: "Home Depot", sector: "Consumer Discretionary", industry: "Retail", market: "US", exchange: "NYSE" },
  { symbol: "MCD", name: "McDonald's", sector: "Consumer Discretionary", industry: "Restaurants", market: "US", exchange: "NYSE" },
  { symbol: "DIS", name: "Walt Disney", sector: "Communication Services", industry: "Entertainment", market: "US", exchange: "NYSE" },
  { symbol: "NFLX", name: "Netflix", sector: "Communication Services", industry: "Entertainment", market: "US", exchange: "NASDAQ" },
  { symbol: "AVGO", name: "Broadcom", sector: "Technology", industry: "Semiconductors", market: "US", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", industry: "Semiconductors", market: "US", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel", sector: "Technology", industry: "Semiconductors", market: "US", exchange: "NASDAQ" },
  { symbol: "ORCL", name: "Oracle", sector: "Technology", industry: "Software", market: "US", exchange: "NYSE" },
  { symbol: "CRM", name: "Salesforce", sector: "Technology", industry: "Software", market: "US", exchange: "NYSE" },
  { symbol: "ADBE", name: "Adobe", sector: "Technology", industry: "Software", market: "US", exchange: "NASDAQ" },
  { symbol: "BAC", name: "Bank of America", sector: "Financials", industry: "Banks", market: "US", exchange: "NYSE" },
  { symbol: "WFC", name: "Wells Fargo", sector: "Financials", industry: "Banks", market: "US", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs", sector: "Financials", industry: "Investment Banking", market: "US", exchange: "NYSE" },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials", industry: "Investment Banking", market: "US", exchange: "NYSE" },
  { symbol: "BLK", name: "BlackRock", sector: "Financials", industry: "Asset Management", market: "US", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer", sector: "Health Care", industry: "Pharma", market: "US", exchange: "NYSE" },
  { symbol: "MRK", name: "Merck", sector: "Health Care", industry: "Pharma", market: "US", exchange: "NYSE" },
  { symbol: "ABBV", name: "AbbVie", sector: "Health Care", industry: "Pharma", market: "US", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Health Care", industry: "Life Sciences Tools", market: "US", exchange: "NYSE" },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Health Care", industry: "Medical Devices", market: "US", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike", sector: "Consumer Discretionary", industry: "Apparel", market: "US", exchange: "NYSE" },
  { symbol: "SBUX", name: "Starbucks", sector: "Consumer Discretionary", industry: "Restaurants", market: "US", exchange: "NASDAQ" },
  { symbol: "BA", name: "Boeing", sector: "Industrials", industry: "Aerospace & Defense", market: "US", exchange: "NYSE" },
  { symbol: "CAT", name: "Caterpillar", sector: "Industrials", industry: "Machinery", market: "US", exchange: "NYSE" },
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", industry: "Aerospace", market: "US", exchange: "NYSE" },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrials", industry: "Logistics", market: "US", exchange: "NYSE" },
  { symbol: "T", name: "AT&T", sector: "Communication Services", industry: "Telecom", market: "US", exchange: "NYSE" },
  { symbol: "VZ", name: "Verizon", sector: "Communication Services", industry: "Telecom", market: "US", exchange: "NYSE" },
  { symbol: "QCOM", name: "Qualcomm", sector: "Technology", industry: "Semiconductors", market: "US", exchange: "NASDAQ" },
];

export function getUniverse(market: Market): UniverseEntry[] {
  return market === "IN" ? UNIVERSE_IN : UNIVERSE_US;
}

export function findEntry(symbol: string): UniverseEntry | undefined {
  return [...UNIVERSE_IN, ...UNIVERSE_US].find((e) => e.symbol === symbol);
}

export function indexSymbolFor(market: Market): string {
  return market === "IN" ? "^NSEI" : "^GSPC";
}

export function currencyFor(market: Market): "INR" | "USD" {
  return market === "IN" ? "INR" : "USD";
}
