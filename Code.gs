/**
 * Official central bank exchange rates in Google Sheets. No API key.
 *
 * Install: Extensions → Apps Script → paste this file → Save. Then in any cell:
 *
 *   =CBRATE("ecb", "USD")               1 EUR in USD, ECB latest reference table
 *   =CBRATE("rbi", "INR", "USD")        1 USD in INR, Reserve Bank of India
 *   =CBRATE("hmrc", "EUR")              HMRC monthly rate, 1 GBP in EUR (for VAT)
 *   =CBCONVERT(100, "USD", "EUR")       convert 100 USD to EUR via the ECB table
 *   =CBCONVERT(100, "USD", "EUR", "fed")
 *   =CBTABLE("boe")                     the whole latest table as rows
 *   =CBDATE("ecb")                      publication date of the latest table
 *   =CBHISTORY("ecb", 2026)             every rate the ECB published in 2026 (CSV via jsDelivr)
 *
 * Data: https://allratestoday.com/central-bank-rates-api/ (keyless open endpoint) and
 * https://github.com/AllRates-Today/central-bank-exchange-rates (daily JSON/CSV files).
 * Free to use with attribution to AllRatesToday.
 */

var OPEN_ = 'https://allratestoday.com/api/open/central-bank/';
var FILES_ = 'https://cdn.jsdelivr.net/gh/AllRates-Today/central-bank-exchange-rates@main/data/';

function table_(bank) {
  bank = String(bank || 'ecb').toLowerCase();
  var cache = CacheService.getScriptCache();
  var hit = cache.get('cb:' + bank);
  if (hit) return JSON.parse(hit);
  var res = UrlFetchApp.fetch(OPEN_ + bank, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('No published table for "' + bank + '"');
  var text = res.getContentText();
  cache.put('cb:' + bank, text, 1800); // tables change once a day; 30 min cache
  return JSON.parse(text);
}

function resolve_(t, source, target) {
  source = String(source).toUpperCase(); target = String(target).toUpperCase();
  if (source === target) return 1;
  var map = {};
  t.rates.forEach(function (r) { map[r.base + '/' + r.quote] = r.value; });
  if (map[source + '/' + target]) return map[source + '/' + target];
  if (map[target + '/' + source]) return 1 / map[target + '/' + source];
  var get = function (a, b) { return map[a + '/' + b] || (map[b + '/' + a] ? 1 / map[b + '/' + a] : null); };
  var seen = {};
  for (var i = 0; i < t.rates.length; i++) {
    [t.rates[i].base, t.rates[i].quote].forEach(function (home) {
      if (seen[home]) return; seen[home] = 1;
      var a = get(home, source), b = get(home, target);
      if (a && b && seen.result == null) seen.result = b / a;
    });
    if (seen.result != null) return seen.result;
  }
  throw new Error(t.bank + ' does not publish a rate covering ' + source + '/' + target);
}

/**
 * Official rate for one unit of `base` in `quote`, from a bank's latest table.
 * @param {string} bank Source code: ecb, fed, boe, rbi, pboc, hmrc, ustreasury ...
 * @param {string} quote Currency to price in, e.g. "USD".
 * @param {string} [base] Currency to price; defaults to the bank's home currency.
 * @return {number}
 * @customfunction
 */
function CBRATE(bank, quote, base) {
  var t = table_(bank);
  if (!base) {
    var counts = {};
    t.rates.forEach(function (r) { counts[r.base] = (counts[r.base] || 0) + 1; counts[r.quote] = (counts[r.quote] || 0) + 1; });
    base = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  }
  return resolve_(t, base, quote);
}

/**
 * Convert an amount using a bank's latest published table (default ECB).
 * @param {number} amount
 * @param {string} source
 * @param {string} target
 * @param {string} [bank]
 * @return {number}
 * @customfunction
 */
function CBCONVERT(amount, source, target, bank) {
  return Number(amount) * resolve_(table_(bank || 'ecb'), source, target);
}

/**
 * Publication date of a bank's latest table, as text (YYYY-MM-DD).
 * @param {string} bank
 * @return {string}
 * @customfunction
 */
function CBDATE(bank) { return table_(bank).rate_date; }

/**
 * A bank's whole latest table: base, quote, type, value rows with a header.
 * @param {string} bank
 * @return {Array<Array>}
 * @customfunction
 */
function CBTABLE(bank) {
  var t = table_(bank);
  var rows = [['date', 'base', 'quote', 'type', 'value']];
  t.rates.forEach(function (r) { rows.push([t.rate_date, r.base, r.quote, r.type, r.value]); });
  return rows;
}

/**
 * Every rate a bank published in a year, from the daily CSV files.
 * @param {string} bank
 * @param {number} year
 * @return {Array<Array>}
 * @customfunction
 */
function CBHISTORY(bank, year) {
  var url = FILES_ + String(bank).toLowerCase() + '/history/' + year + '.csv';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('No history file at ' + url);
  return Utilities.parseCsv(res.getContentText()).map(function (row, i) {
    return i === 0 ? row : [row[0], row[1], row[2], row[3], Number(row[4])];
  });
}
