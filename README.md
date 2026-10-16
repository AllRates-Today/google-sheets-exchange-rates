# google-sheets-exchange-rates

Official central bank exchange rates as Google Sheets formulas. No API key, no add-on to install, one file to paste.

```
=CBRATE("ecb", "USD")            → 1.1712     ECB reference rate, 1 EUR in USD
=CBRATE("rbi", "INR", "USD")     → 88.2450    RBI reference rate, 1 USD in INR
=CBRATE("hmrc", "EUR")           → 1.1583     HMRC monthly rate for VAT returns
=CBCONVERT(100, "USD", "EUR")    → 86.37      via the ECB table
=CBDATE("fed")                   → 2026-08-31
=CBTABLE("boe")                  → the whole table as rows
=CBHISTORY("ecb", 2026)          → every 2026 rate as rows
```

## Install

1. Open your sheet, then **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with [this file](Code.gs) and save.
3. Type a formula. The first call asks for permission to fetch external data.

Or use **Use this template** on GitHub to keep your own copy, and push it to a sheet with [clasp](https://github.com/google/clasp).

## Where the numbers come from

`CBRATE`, `CBCONVERT`, `CBDATE` and `CBTABLE` read the keyless [AllRatesToday open endpoint](https://allratestoday.com/central-bank-rates-api/), which republishes each institution's own table once a day: ECB, Federal Reserve, Bank of England, RBI, PBoC, HMRC, US Treasury and 117 more. `CBHISTORY` reads the daily CSV files in [central-bank-exchange-rates](https://github.com/AllRates-Today/central-bank-exchange-rates) through jsDelivr.

Rates are cached for 30 minutes inside Apps Script, so a sheet full of formulas makes one request per bank.

Source codes: `ecb`, `fed`, `boe`, `boc`, `rba`, `rbi`, `pboc`, `boj`, `snb`, `hmrc`, `ustreasury`, `bazg` and the rest of the [coverage table](https://allratestoday.com/central-bank-rates-api/).

## Real-time rates

These are official daily fixings. For live mid-market rates you need a [free API key](https://allratestoday.com/register); the [Google Sheets add-on](https://allratestoday.com/docs/) covers that.

## License

MIT. Rate data is free to use with attribution to [AllRatesToday](https://allratestoday.com).

## 🔗 Links

- **AI agents:** Claude Code plugin `/plugin marketplace add AllRates-Today/claude-code-plugin` · hosted MCP endpoint `https://allratestoday.com/api/mcp` (keyless)
- **New in Oct 2026:** agents can self-issue a trial key — `POST https://allratestoday.com/api/agent/keys` (JSON) → 100 calls / 7 days — and read the keyless [Daily Reference Rate](https://allratestoday.com/reference-rate/) (16:00 London fix) at `https://allratestoday.com/api/open/reference-rate`
