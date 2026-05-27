/**
 * Extended internet tool implementations for PowerfulTiger.
 * ~80 tools across entertainment, science, dev, finance, and geography.
 */

import type { Tool } from 'ollama';

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERTAINMENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetJoke(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://official-joke-api.appspot.com/random_joke');
    const d = await r.json() as { setup: string; punchline: string; type: string };
    return JSON.stringify({ setup: d.setup, punchline: d.punchline, type: d.type });
  } catch { return JSON.stringify({ error: 'Could not fetch joke' }); }
}

export async function toolGetDadJoke(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } });
    const d = await r.json() as { joke: string };
    return JSON.stringify({ joke: d.joke });
  } catch { return JSON.stringify({ error: 'Could not fetch dad joke' }); }
}

export async function toolGetRandomFact(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    const d = await r.json() as { text: string; source_url: string };
    return JSON.stringify({ fact: d.text, source: d.source_url });
  } catch { return JSON.stringify({ error: 'Could not fetch fact' }); }
}

export async function toolGetCatFact(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://catfact.ninja/fact');
    const d = await r.json() as { fact: string };
    return JSON.stringify({ fact: d.fact });
  } catch { return JSON.stringify({ error: 'Could not fetch cat fact' }); }
}

export async function toolGetDogImage(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://dog.ceo/api/breeds/image/random');
    const d = await r.json() as { message: string; status: string };
    return JSON.stringify({ image_url: d.message, status: d.status });
  } catch { return JSON.stringify({ error: 'Could not fetch dog image' }); }
}

export async function toolGetPokemon(args: Record<string, unknown>): Promise<string> {
  const name = String(args.name ?? 'pikachu').toLowerCase();
  try {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!r.ok) return JSON.stringify({ error: `Pokémon "${name}" not found` });
    const d = await r.json() as { id: number; name: string; height: number; weight: number; base_experience: number; types: Array<{ type: { name: string } }>; stats: Array<{ base_stat: number; stat: { name: string } }>; abilities: Array<{ ability: { name: string } }> };
    return JSON.stringify({
      id: d.id, name: d.name, height: `${d.height * 10}cm`, weight: `${d.weight / 10}kg`,
      types: d.types.map(t => t.type.name),
      stats: Object.fromEntries(d.stats.map(s => [s.stat.name, s.base_stat])),
      abilities: d.abilities.map(a => a.ability.name), base_experience: d.base_experience,
    });
  } catch { return JSON.stringify({ error: 'Could not fetch Pokémon data' }); }
}

export async function toolGetRecipe(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? 'pasta');
  try {
    const r = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const d = await r.json() as { meals: Array<{ idMeal: string; strMeal: string; strCategory: string; strArea: string; strInstructions: string; strMealThumb: string }> | null };
    if (!d.meals?.length) return JSON.stringify({ error: `No recipes found for "${query}"` });
    const m = d.meals[0];
    return JSON.stringify({ name: m.strMeal, category: m.strCategory, cuisine: m.strArea, thumbnail: m.strMealThumb, instructions_preview: m.strInstructions.slice(0, 500) + '…' });
  } catch { return JSON.stringify({ error: 'Could not fetch recipe' }); }
}

export async function toolGetCocktail(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? 'margarita');
  try {
    const r = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const d = await r.json() as { drinks: Array<{ strDrink: string; strCategory: string; strAlcoholic: string; strGlass: string; strInstructions: string; strDrinkThumb: string }> | null };
    if (!d.drinks?.length) return JSON.stringify({ error: `No cocktail found for "${query}"` });
    const c = d.drinks[0];
    return JSON.stringify({ name: c.strDrink, category: c.strCategory, alcoholic: c.strAlcoholic, glass: c.strGlass, thumbnail: c.strDrinkThumb, instructions: c.strInstructions.slice(0, 500) });
  } catch { return JSON.stringify({ error: 'Could not fetch cocktail' }); }
}

export async function toolGetBookByISBN(args: Record<string, unknown>): Promise<string> {
  const isbn = String(args.isbn).replace(/[-\s]/g, '');
  try {
    const r = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const d = await r.json() as Record<string, { title: string; authors: Array<{ name: string }>; publish_date: string; publishers: Array<{ name: string }>; number_of_pages: number; subjects?: Array<{ name: string }> }>;
    const key = Object.keys(d)[0];
    if (!key) return JSON.stringify({ error: `No book found for ISBN ${isbn}` });
    const b = d[key];
    return JSON.stringify({ title: b.title, authors: b.authors?.map(a => a.name), published: b.publish_date, publisher: b.publishers?.[0]?.name, pages: b.number_of_pages, isbn, subjects: b.subjects?.slice(0, 5).map(s => s.name) });
  } catch { return JSON.stringify({ error: 'Could not fetch book data' }); }
}

export async function toolSearchBooks(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query);
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
    const d = await r.json() as { docs: Array<{ title: string; author_name?: string[]; first_publish_year?: number; isbn?: string[] }>; numFound: number };
    return JSON.stringify({ total_results: d.numFound, books: d.docs.map(b => ({ title: b.title, authors: b.author_name, year: b.first_publish_year, isbn: b.isbn?.[0] })) });
  } catch { return JSON.stringify({ error: 'Could not search books' }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCIENCE & NATURE
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetISSLocation(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('http://api.open-notify.org/iss-now.json');
    const d = await r.json() as { iss_position: { latitude: string; longitude: string }; timestamp: number };
    const { latitude, longitude } = d.iss_position;
    return JSON.stringify({ latitude: Number(latitude), longitude: Number(longitude), timestamp: d.timestamp, timestamp_utc: new Date(d.timestamp * 1000).toISOString(), note: 'ISS moves at ~7.7 km/s — position updates every second' });
  } catch { return JSON.stringify({ error: 'Could not fetch ISS location' }); }
}

export async function toolGetSpaceNews(args: Record<string, unknown>): Promise<string> {
  const limit = Math.min(Number(args.limit ?? 5), 10);
  try {
    const r = await fetch(`https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}&ordering=-published_at`);
    const d = await r.json() as { results: Array<{ title: string; summary: string; url: string; published_at: string; news_site: string }> };
    return JSON.stringify({ articles: d.results.map(a => ({ title: a.title, summary: a.summary.slice(0, 200), source: a.news_site, published: a.published_at, url: a.url })) });
  } catch { return JSON.stringify({ error: 'Could not fetch space news' }); }
}

export async function toolGetEarthquakes(args: Record<string, unknown>): Promise<string> {
  const minMag = Number(args.min_magnitude ?? 5);
  try {
    const r = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson`);
    const d = await r.json() as { features: Array<{ properties: { place: string; mag: number; time: number; url: string; status: string }; geometry: { coordinates: number[] } }> };
    const quakes = d.features.filter(f => f.properties.mag >= minMag).slice(0, 10).map(f => ({
      place: f.properties.place, magnitude: f.properties.mag,
      time: new Date(f.properties.time).toISOString(),
      coordinates: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], depth_km: f.geometry.coordinates[2] },
      url: f.properties.url,
    }));
    return JSON.stringify({ count: quakes.length, min_magnitude: minMag, earthquakes: quakes });
  } catch { return JSON.stringify({ error: 'Could not fetch earthquake data' }); }
}

export async function toolGetSunriseSunset(args: Record<string, unknown>): Promise<string> {
  const lat = Number(args.latitude), lon = Number(args.longitude), date = String(args.date ?? new Date().toISOString().slice(0, 10));
  try {
    const r = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`);
    const d = await r.json() as { results: { sunrise: string; sunset: string; solar_noon: string; day_length: number; civil_twilight_begin: string; civil_twilight_end: string }; status: string };
    if (d.status !== 'OK') return JSON.stringify({ error: 'Invalid coordinates' });
    return JSON.stringify({ date, latitude: lat, longitude: lon, ...d.results });
  } catch { return JSON.stringify({ error: 'Could not fetch sunrise/sunset data' }); }
}

export async function toolSearchArxiv(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query), limit = Math.min(Number(args.limit ?? 5), 10);
  try {
    const r = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`);
    const xml = await r.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
      const e = m[1];
      const get = (tag: string) => e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))?.[1]?.trim() ?? '';
      return { title: get('title').replace(/\n/g, ' '), authors: [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(a => a[1]).join(', '), summary: get('summary').slice(0, 300), published: get('published'), link: get('id') };
    });
    return JSON.stringify({ query, count: entries.length, papers: entries });
  } catch { return JSON.stringify({ error: 'Could not search arXiv' }); }
}

export async function toolGetFoodNutrition(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query);
  try {
    const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&api_key=DEMO_KEY`);
    const d = await r.json() as { foods: Array<{ description: string; brandOwner?: string; servingSize?: number; servingSizeUnit?: string; foodNutrients: Array<{ nutrientName: string; value: number; unitName: string }> }> };
    if (!d.foods?.length) return JSON.stringify({ error: `No nutrition data found for "${query}"` });
    const f = d.foods[0];
    const nutrients = Object.fromEntries(f.foodNutrients.slice(0, 15).map(n => [n.nutrientName, `${n.value} ${n.unitName}`]));
    return JSON.stringify({ food: f.description, brand: f.brandOwner, serving: f.servingSize ? `${f.servingSize} ${f.servingSizeUnit}` : 'per 100g', nutrients });
  } catch { return JSON.stringify({ error: 'Could not fetch nutrition data (USDA DEMO_KEY rate limited — try again)' }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEV & CODE
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetGitHubUser(args: Record<string, unknown>): Promise<string> {
  const username = String(args.username);
  try {
    const r = await fetch(`https://api.github.com/users/${username}`, { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'PowerfulTiger' } });
    if (!r.ok) return JSON.stringify({ error: `GitHub user "${username}" not found` });
    const d = await r.json() as { name: string; login: string; bio: string; company: string; location: string; public_repos: number; followers: number; following: number; created_at: string; blog: string };
    return JSON.stringify({ username: d.login, name: d.name, bio: d.bio, company: d.company, location: d.location, blog: d.blog, public_repos: d.public_repos, followers: d.followers, following: d.following, joined: d.created_at });
  } catch { return JSON.stringify({ error: 'Could not fetch GitHub user' }); }
}

export async function toolGetGitHubReleases(args: Record<string, unknown>): Promise<string> {
  const repo = String(args.repo);
  const limit = Math.min(Number(args.limit ?? 5), 10);
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=${limit}`, { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'PowerfulTiger' } });
    if (!r.ok) return JSON.stringify({ error: `Repo "${repo}" not found or no releases` });
    const releases = await r.json() as Array<{ tag_name: string; name: string; published_at: string; prerelease: boolean; body: string }>;
    return JSON.stringify({ repo, releases: releases.map(rel => ({ tag: rel.tag_name, name: rel.name, published: rel.published_at, prerelease: rel.prerelease, notes_preview: rel.body?.slice(0, 300) })) });
  } catch { return JSON.stringify({ error: 'Could not fetch releases' }); }
}

export async function toolGetNPMDownloads(args: Record<string, unknown>): Promise<string> {
  const pkg = String(args.package), period = String(args.period ?? 'last-month');
  try {
    const r = await fetch(`https://api.npmjs.org/downloads/point/${period}/${pkg}`);
    const d = await r.json() as { downloads: number; start: string; end: string; package: string };
    return JSON.stringify({ package: d.package, period, downloads: d.downloads, start: d.start, end: d.end });
  } catch { return JSON.stringify({ error: 'Could not fetch npm download stats' }); }
}

export async function toolGetPyPIPackage(args: Record<string, unknown>): Promise<string> {
  const pkg = String(args.package);
  try {
    const r = await fetch(`https://pypi.org/pypi/${pkg}/json`);
    if (!r.ok) return JSON.stringify({ error: `Package "${pkg}" not found on PyPI` });
    const d = await r.json() as { info: { name: string; version: string; summary: string; author: string; license: string; home_page: string; requires_python: string; keywords: string }; urls: Array<{ upload_time: string }> };
    const i = d.info;
    return JSON.stringify({ name: i.name, version: i.version, summary: i.summary, author: i.author, license: i.license, homepage: i.home_page, requires_python: i.requires_python, keywords: i.keywords, latest_release: d.urls?.[0]?.upload_time });
  } catch { return JSON.stringify({ error: 'Could not fetch PyPI package' }); }
}

export async function toolGetCrateInfo(args: Record<string, unknown>): Promise<string> {
  const crate = String(args.crate);
  try {
    const r = await fetch(`https://crates.io/api/v1/crates/${crate}`, { headers: { 'User-Agent': 'PowerfulTiger' } });
    if (!r.ok) return JSON.stringify({ error: `Crate "${crate}" not found` });
    const d = await r.json() as { crate: { name: string; description: string; downloads: number; max_version: string; homepage: string; repository: string; documentation: string }; versions: Array<{ num: string; updated_at: string }> };
    const c = d.crate;
    return JSON.stringify({ name: c.name, latest_version: c.max_version, description: c.description, downloads: c.downloads, homepage: c.homepage, repository: c.repository, documentation: c.documentation, recent_versions: d.versions.slice(0, 5).map(v => ({ version: v.num, updated: v.updated_at })) });
  } catch { return JSON.stringify({ error: 'Could not fetch crate info' }); }
}

export async function toolGetDNSRecords(args: Record<string, unknown>): Promise<string> {
  const domain = String(args.domain), type = String(args.type ?? 'A').toUpperCase();
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`);
    const d = await r.json() as { Answer?: Array<{ name: string; type: number; TTL: number; data: string }>; Status: number };
    const typeMap: Record<number, string> = { 1:'A', 2:'NS', 5:'CNAME', 15:'MX', 16:'TXT', 28:'AAAA', 33:'SRV', 257:'CAA' };
    if (!d.Answer) return JSON.stringify({ domain, type, records: [], note: 'No records found' });
    return JSON.stringify({ domain, type, records: d.Answer.map(r => ({ name: r.name, type: typeMap[r.type] ?? r.type, ttl: r.TTL, value: r.data })) });
  } catch { return JSON.stringify({ error: 'Could not perform DNS lookup' }); }
}

export async function toolCheckSSL(args: Record<string, unknown>): Promise<string> {
  const domain = String(args.domain).replace(/^https?:\/\//, '').split('/')[0];
  try {
    const start = Date.now();
    const r = await fetch(`https://${domain}`, { signal: AbortSignal.timeout(8000) });
    const ms = Date.now() - start;
    return JSON.stringify({ domain, ssl_valid: true, status: r.status, response_time_ms: ms, url: r.url });
  } catch (e) {
    const msg = String(e);
    const ssl_error = msg.includes('CERT') || msg.includes('SSL') || msg.includes('certificate');
    return JSON.stringify({ domain, ssl_valid: false, ssl_error, error: msg.slice(0, 200) });
  }
}

export async function toolGetHTTPHeaders(args: Record<string, unknown>): Promise<string> {
  const url = String(args.url);
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    const headers: Record<string, string> = {};
    r.headers.forEach((v, k) => { headers[k] = v; });
    return JSON.stringify({ url, status: r.status, ok: r.ok, headers });
  } catch { return JSON.stringify({ error: 'Could not fetch headers — site may be down or blocking HEAD' }); }
}

export async function toolGetRobotsTxt(args: Record<string, unknown>): Promise<string> {
  const url = String(args.url);
  const base = new URL(url.startsWith('http') ? url : `https://${url}`);
  try {
    const r = await fetch(`${base.origin}/robots.txt`);
    const text = await r.text();
    return JSON.stringify({ url: `${base.origin}/robots.txt`, status: r.status, content: text.slice(0, 2000) });
  } catch { return JSON.stringify({ error: 'Could not fetch robots.txt' }); }
}

export async function toolSearchGitHubRepos(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query), sort = String(args.sort ?? 'stars'), limit = Math.min(Number(args.limit ?? 5), 10);
  try {
    const r = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`, { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'PowerfulTiger' } });
    const d = await r.json() as { total_count: number; items: Array<{ full_name: string; description: string; stargazers_count: number; forks_count: number; language: string; updated_at: string; html_url: string }> };
    return JSON.stringify({ query, total_results: d.total_count, repos: d.items.map(repo => ({ name: repo.full_name, description: repo.description, stars: repo.stargazers_count, forks: repo.forks_count, language: repo.language, updated: repo.updated_at, url: repo.html_url })) });
  } catch { return JSON.stringify({ error: 'Could not search GitHub repos' }); }
}

export async function toolGetGitHubIssues(args: Record<string, unknown>): Promise<string> {
  const repo = String(args.repo), state = String(args.state ?? 'open'), limit = Math.min(Number(args.limit ?? 5), 10);
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/issues?state=${state}&per_page=${limit}`, { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'PowerfulTiger' } });
    if (!r.ok) return JSON.stringify({ error: `Repo "${repo}" not found` });
    const issues = await r.json() as Array<{ number: number; title: string; state: string; created_at: string; user: { login: string }; labels: Array<{ name: string }> }>;
    return JSON.stringify({ repo, state, issues: issues.map(i => ({ number: i.number, title: i.title, state: i.state, author: i.user.login, labels: i.labels.map(l => l.name), created: i.created_at })) });
  } catch { return JSON.stringify({ error: 'Could not fetch issues' }); }
}

export async function toolGetNPMVersions(args: Record<string, unknown>): Promise<string> {
  const pkg = String(args.package);
  try {
    const r = await fetch(`https://registry.npmjs.org/${pkg}`);
    if (!r.ok) return JSON.stringify({ error: `Package "${pkg}" not found` });
    const d = await r.json() as { name: string; 'dist-tags': Record<string, string>; versions: Record<string, unknown> };
    const versions = Object.keys(d.versions).slice(-10).reverse();
    return JSON.stringify({ package: d.name, dist_tags: d['dist-tags'], recent_versions: versions, total_versions: Object.keys(d.versions).length });
  } catch { return JSON.stringify({ error: 'Could not fetch npm versions' }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE & MARKETS
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetFearGreedIndex(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=1&format=json');
    const d = await r.json() as { data: Array<{ value: string; value_classification: string; timestamp: string }> };
    const item = d.data[0];
    const value = Number(item.value);
    return JSON.stringify({ value, classification: item.value_classification, timestamp: new Date(Number(item.timestamp) * 1000).toISOString(), interpretation: value <= 25 ? 'Extreme Fear — potential buy opportunity' : value <= 45 ? 'Fear — market cautious' : value <= 55 ? 'Neutral' : value <= 75 ? 'Greed — market optimistic' : 'Extreme Greed — potential sell signal' });
  } catch { return JSON.stringify({ error: 'Could not fetch Fear & Greed index' }); }
}

export async function toolGetHistoricalExchangeRate(args: Record<string, unknown>): Promise<string> {
  const date = String(args.date), from = String(args.from ?? 'USD').toUpperCase(), to = String(args.to ?? 'EUR').toUpperCase();
  try {
    const r = await fetch(`https://api.frankfurter.app/${date}?from=${from}&to=${to}`);
    if (!r.ok) return JSON.stringify({ error: 'Invalid date or currency' });
    const d = await r.json() as { date: string; base: string; rates: Record<string, number> };
    const rate = d.rates[to];
    return JSON.stringify({ date: d.date, from, to, rate, note: `1 ${from} = ${rate} ${to}` });
  } catch { return JSON.stringify({ error: 'Could not fetch historical rate' }); }
}

export async function toolGetCurrencyList(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://api.frankfurter.app/currencies');
    const currencies = await r.json() as Record<string, string>;
    return JSON.stringify({ count: Object.keys(currencies).length, currencies });
  } catch { return JSON.stringify({ error: 'Could not fetch currency list' }); }
}

export async function toolGetCryptoGlobalStats(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/global');
    const d = await r.json() as { data: { total_market_cap: Record<string, number>; total_volume: Record<string, number>; market_cap_percentage: Record<string, number>; market_cap_change_percentage_24h_usd: number; active_cryptocurrencies: number; ongoing_icos: number; btc_dominance: number; eth_dominance: number } };
    const g = d.data;
    return JSON.stringify({ total_market_cap_usd: `$${(g.total_market_cap.usd / 1e12).toFixed(2)}T`, total_24h_volume_usd: `$${(g.total_volume.usd / 1e9).toFixed(2)}B`, market_cap_change_24h_percent: +g.market_cap_change_percentage_24h_usd.toFixed(2), btc_dominance: +g.btc_dominance.toFixed(2), eth_dominance: +g.eth_dominance.toFixed(2), active_cryptocurrencies: g.active_cryptocurrencies, top_coins_by_dominance: Object.entries(g.market_cap_percentage).slice(0, 5).map(([coin, pct]) => ({ coin: coin.toUpperCase(), dominance_percent: +pct.toFixed(2) })) });
  } catch { return JSON.stringify({ error: 'Could not fetch crypto global stats' }); }
}

export async function toolGetTrendingCrypto(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const d = await r.json() as { coins: Array<{ item: { id: string; name: string; symbol: string; market_cap_rank: number; price_btc: number } }> };
    return JSON.stringify({ trending: d.coins.slice(0, 7).map(c => ({ name: c.item.name, symbol: c.item.symbol.toUpperCase(), rank: c.item.market_cap_rank, price_btc: c.item.price_btc })) });
  } catch { return JSON.stringify({ error: 'Could not fetch trending crypto' }); }
}

export async function toolGetETHGasPrice(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken');
    const d = await r.json() as { result: { SafeGasPrice: string; ProposeGasPrice: string; FastGasPrice: string } };
    if (!d.result?.SafeGasPrice) throw new Error('no data');
    return JSON.stringify({ slow_gwei: d.result.SafeGasPrice, standard_gwei: d.result.ProposeGasPrice, fast_gwei: d.result.FastGasPrice, note: 'Etherscan gas tracker' });
  } catch {
    try {
      const r2 = await fetch('https://beaconcha.in/api/v1/execution/gasnow');
      const d2 = await r2.json() as { data: { rapid: number; fast: number; standard: number; slow: number } };
      const toGwei = (wei: number) => +(wei / 1e9).toFixed(2);
      return JSON.stringify({ slow_gwei: toGwei(d2.data.slow), standard_gwei: toGwei(d2.data.standard), fast_gwei: toGwei(d2.data.fast), rapid_gwei: toGwei(d2.data.rapid), source: 'beaconcha.in' });
    } catch { return JSON.stringify({ error: 'Could not fetch ETH gas price' }); }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD & GEOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetCountriesByRegion(args: Record<string, unknown>): Promise<string> {
  const region = String(args.region);
  try {
    const r = await fetch(`https://restcountries.com/v3.1/region/${encodeURIComponent(region)}?fields=name,capital,population,currencies,languages`);
    if (!r.ok) return JSON.stringify({ error: `Region "${region}" not found` });
    const countries = await r.json() as Array<{ name: { common: string }; capital?: string[]; population: number }>;
    return JSON.stringify({ region, count: countries.length, countries: countries.sort((a, b) => b.population - a.population).map(c => ({ name: c.name.common, capital: c.capital?.[0], population: c.population })) });
  } catch { return JSON.stringify({ error: 'Could not fetch countries by region' }); }
}

export async function toolGetTimezoneInfo(args: Record<string, unknown>): Promise<string> {
  const timezone = String(args.timezone ?? 'America/New_York');
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'long', hour12: false });
    const parts = Object.fromEntries(fmt.formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const offsetFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
    const offset = offsetFormatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value ?? '';
    return JSON.stringify({ timezone, current_time: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`, timezone_name: parts.timeZoneName, utc_offset: offset });
  } catch { return JSON.stringify({ error: `Invalid timezone: "${timezone}"` }); }
}

export async function toolGetIPCountry(args: Record<string, unknown>): Promise<string> {
  const ip = args.ip ? String(args.ip) : '';
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    const r = await fetch(url);
    const d = await r.json() as { ip: string; country_name: string; country_code: string; region: string; city: string; timezone: string; org: string; currency: string };
    return JSON.stringify({ ip: d.ip, country: d.country_name, country_code: d.country_code, region: d.region, city: d.city, timezone: d.timezone, isp: d.org, currency: d.currency });
  } catch { return JSON.stringify({ error: 'Could not fetch IP country info' }); }
}

export async function toolGetBorderCountries(args: Record<string, unknown>): Promise<string> {
  const country = String(args.country);
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,borders,subregion`);
    if (!r.ok) return JSON.stringify({ error: `Country "${country}" not found` });
    const data = await r.json() as Array<{ name: { common: string }; borders: string[]; subregion: string }>;
    const c = data[0];
    if (!c.borders?.length) return JSON.stringify({ country: c.name.common, borders: [], note: 'Island nation or no land borders' });
    const bordering = await Promise.all(c.borders.slice(0, 15).map(async (code) => {
      const br = await fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=name`);
      const bd = await br.json() as { name: { common: string } };
      return bd.name.common;
    }));
    return JSON.stringify({ country: c.name.common, subregion: c.subregion, border_count: bordering.length, border_countries: bordering });
  } catch { return JSON.stringify({ error: 'Could not fetch border countries' }); }
}

export async function toolGetWeatherForecast(args: Record<string, unknown>): Promise<string> {
  const location = String(args.location);
  try {
    const r = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    const d = await r.json() as { weather: Array<{ date: string; maxtempC: string; mintempC: string; hourly: Array<{ tempC: string; weatherDesc: Array<{ value: string }>; chanceofrain: string; windspeedKmph: string }> }>; nearest_area: Array<{ areaName: Array<{ value: string }>; country: Array<{ value: string }> }> };
    const area = d.nearest_area?.[0];
    return JSON.stringify({ location, city: area?.areaName?.[0]?.value, country: area?.country?.[0]?.value, forecast: d.weather.slice(0, 3).map(day => ({ date: day.date, max_c: day.maxtempC, min_c: day.mintempC, conditions: day.hourly.map(h => h.weatherDesc[0]?.value).filter((v, i, a) => a.indexOf(v) === i).join(', '), chance_of_rain_pct: Math.max(...day.hourly.map(h => Number(h.chanceofrain))) })) });
  } catch { return JSON.stringify({ error: 'Could not fetch weather forecast' }); }
}

export async function toolGetAirQuality(args: Record<string, unknown>): Promise<string> {
  const city = String(args.city ?? 'New York');
  try {
    const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=48.8566&longitude=2.3522&current=pm10,pm2_5,carbon_dioxide,nitrogen_dioxide,ozone&hourly=pm2_5&forecast_days=1`);
    const d = await r.json() as { current: { pm10: number; pm2_5: number; carbon_dioxide: number; nitrogen_dioxide: number; ozone: number } };
    const aqi = d.current.pm2_5 <= 12 ? 'Good' : d.current.pm2_5 <= 35.4 ? 'Moderate' : d.current.pm2_5 <= 55.4 ? 'Unhealthy for Sensitive' : 'Unhealthy';
    return JSON.stringify({ city, pm2_5: d.current.pm2_5, pm10: d.current.pm10, co2_ppm: d.current.carbon_dioxide, no2: d.current.nitrogen_dioxide, ozone: d.current.ozone, aqi_category: aqi, note: 'Location defaulted to Paris — use geocode for precision' });
  } catch { return JSON.stringify({ error: 'Could not fetch air quality' }); }
}

export async function toolGetUVIndex(args: Record<string, unknown>): Promise<string> {
  const lat = Number(args.latitude ?? 40.7128), lon = Number(args.longitude ?? -74.0060);
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index&forecast_days=1&timezone=auto`);
    const d = await r.json() as { hourly: { time: string[]; uv_index: number[] } };
    const maxUV = Math.max(...d.hourly.uv_index);
    const risk = maxUV < 3 ? 'Low' : maxUV < 6 ? 'Moderate' : maxUV < 8 ? 'High' : maxUV < 11 ? 'Very High' : 'Extreme';
    const peakIdx = d.hourly.uv_index.indexOf(maxUV);
    return JSON.stringify({ latitude: lat, longitude: lon, max_uv_index: +maxUV.toFixed(1), peak_time: d.hourly.time[peakIdx], risk_level: risk, recommendation: risk === 'Low' ? 'No protection needed' : risk === 'Moderate' ? 'Wear sunscreen' : 'Seek shade, wear protection' });
  } catch { return JSON.stringify({ error: 'Could not fetch UV index' }); }
}

export async function toolGeocodeAddress(args: Record<string, unknown>): Promise<string> {
  const address = String(args.address);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=3`, { headers: { 'User-Agent': 'PowerfulTiger' } });
    const results = await r.json() as Array<{ display_name: string; lat: string; lon: string; type: string; importance: number }>;
    if (!results.length) return JSON.stringify({ error: `No results for "${address}"` });
    return JSON.stringify({ query: address, results: results.map(r => ({ name: r.display_name, latitude: Number(r.lat), longitude: Number(r.lon), type: r.type })) });
  } catch { return JSON.stringify({ error: 'Could not geocode address' }); }
}

export async function toolReverseGeocode(args: Record<string, unknown>): Promise<string> {
  const lat = Number(args.latitude), lon = Number(args.longitude);
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'User-Agent': 'PowerfulTiger' } });
    const d = await r.json() as { display_name: string; address: { road?: string; city?: string; state?: string; country?: string; postcode?: string; country_code?: string } };
    return JSON.stringify({ latitude: lat, longitude: lon, display_name: d.display_name, road: d.address.road, city: d.address.city, state: d.address.state, country: d.address.country, postcode: d.address.postcode, country_code: d.address.country_code });
  } catch { return JSON.stringify({ error: 'Could not reverse geocode coordinates' }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MORE FUN & MISC
// ═══════════════════════════════════════════════════════════════════════════════

export async function toolGetAnime(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? 'Naruto');
  try {
    const r = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=3&sfw=true`);
    const d = await r.json() as { data: Array<{ title: string; title_english: string; episodes: number; status: string; score: number; synopsis: string; year: number; genres: Array<{ name: string }> }> };
    return JSON.stringify({ query, results: d.data.map(a => ({ title: a.title, title_english: a.title_english, episodes: a.episodes, status: a.status, score: a.score, year: a.year, genres: a.genres.map(g => g.name), synopsis: a.synopsis?.slice(0, 300) })) });
  } catch { return JSON.stringify({ error: 'Could not fetch anime data' }); }
}

export async function toolGetWordRhymes(args: Record<string, unknown>): Promise<string> {
  const word = String(args.word);
  try {
    const r = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=20`);
    const words = await r.json() as Array<{ word: string; score: number }>;
    return JSON.stringify({ word, rhymes: words.map(w => w.word), count: words.length });
  } catch { return JSON.stringify({ error: 'Could not fetch rhymes' }); }
}

export async function toolGetSynonyms(args: Record<string, unknown>): Promise<string> {
  const word = String(args.word);
  try {
    const r = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=20`);
    const words = await r.json() as Array<{ word: string; score: number }>;
    return JSON.stringify({ word, synonyms: words.map(w => w.word), count: words.length });
  } catch { return JSON.stringify({ error: 'Could not fetch synonyms' }); }
}

export async function toolGetAntonyms(args: Record<string, unknown>): Promise<string> {
  const word = String(args.word);
  try {
    const r = await fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=10`);
    const words = await r.json() as Array<{ word: string; score: number }>;
    return JSON.stringify({ word, antonyms: words.map(w => w.word), count: words.length });
  } catch { return JSON.stringify({ error: 'Could not fetch antonyms' }); }
}

export async function toolGetRandomWord(_args: Record<string, unknown>): Promise<string> {
  try {
    const r = await fetch('https://random-word-api.herokuapp.com/word?number=1');
    const words = await r.json() as string[];
    return JSON.stringify({ word: words[0] });
  } catch { return JSON.stringify({ error: 'Could not fetch random word' }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const INTERNET_TOOLS_EXTENDED: Tool[] = [
  // ENTERTAINMENT
  { type:'function', function:{ name:'get_joke', description:'Get a random joke (setup and punchline).', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_dad_joke', description:'Get a random dad joke.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_random_fact', description:'Get a random interesting fact.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_cat_fact', description:'Get a random cat fact.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_dog_image', description:'Get a URL to a random dog image.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_pokemon', description:'Get stats, types, and abilities for a Pokémon by name or number.', parameters:{ type:'object', required:[], properties:{ name:{ type:'string', description:'Pokémon name or ID. Default: pikachu' } } } } },
  { type:'function', function:{ name:'get_recipe', description:'Search for a recipe by ingredient or dish name.', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string', description:'Dish name or main ingredient' } } } } },
  { type:'function', function:{ name:'get_cocktail', description:'Search for a cocktail or drink recipe.', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string', description:'Cocktail name' } } } } },
  { type:'function', function:{ name:'get_book_by_isbn', description:'Look up a book by its ISBN.', parameters:{ type:'object', required:['isbn'], properties:{ isbn:{ type:'string' } } } } },
  { type:'function', function:{ name:'search_books', description:'Search for books by title, author, or subject.', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_anime', description:'Search for anime by title (powered by Jikan/MAL).', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string' } } } } },
  { type:'function', function:{ name:'word_rhymes', description:'Find words that rhyme with a given word.', parameters:{ type:'object', required:['word'], properties:{ word:{ type:'string' } } } } },
  { type:'function', function:{ name:'word_synonyms', description:'Find synonyms for a word.', parameters:{ type:'object', required:['word'], properties:{ word:{ type:'string' } } } } },
  { type:'function', function:{ name:'word_antonyms', description:'Find antonyms for a word.', parameters:{ type:'object', required:['word'], properties:{ word:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_random_word', description:'Get a random English word.', parameters:{ type:'object', required:[], properties:{} } } },
  // SCIENCE & NATURE
  { type:'function', function:{ name:'get_iss_location', description:'Get the current real-time latitude and longitude of the ISS (International Space Station).', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_space_news', description:'Get the latest space and astronomy news articles.', parameters:{ type:'object', required:[], properties:{ limit:{ type:'number', description:'Number of articles (max 10, default 5)' } } } } },
  { type:'function', function:{ name:'get_earthquakes', description:'Get recent significant earthquakes worldwide from USGS.', parameters:{ type:'object', required:[], properties:{ min_magnitude:{ type:'number', description:'Minimum magnitude filter. Default 5.' } } } } },
  { type:'function', function:{ name:'get_sunrise_sunset', description:'Get sunrise and sunset times for any coordinates and date.', parameters:{ type:'object', required:['latitude','longitude'], properties:{ latitude:{ type:'number' }, longitude:{ type:'number' }, date:{ type:'string', description:'ISO date. Default: today.' } } } } },
  { type:'function', function:{ name:'search_arxiv', description:'Search academic papers on arXiv (computer science, physics, math, AI, etc.).', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string' }, limit:{ type:'number', description:'Number of results (max 10, default 5)' } } } } },
  { type:'function', function:{ name:'get_food_nutrition', description:'Look up nutrition facts for a food item (USDA database).', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string', description:'Food name, e.g. "apple", "chicken breast"' } } } } },
  { type:'function', function:{ name:'geocode_address', description:'Convert an address or place name to latitude/longitude coordinates.', parameters:{ type:'object', required:['address'], properties:{ address:{ type:'string' } } } } },
  { type:'function', function:{ name:'reverse_geocode', description:'Convert latitude/longitude coordinates to an address.', parameters:{ type:'object', required:['latitude','longitude'], properties:{ latitude:{ type:'number' }, longitude:{ type:'number' } } } } },
  // DEV & CODE
  { type:'function', function:{ name:'get_github_user', description:'Get GitHub user profile: bio, repos, followers, join date.', parameters:{ type:'object', required:['username'], properties:{ username:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_github_releases', description:'Get the latest releases for a GitHub repository.', parameters:{ type:'object', required:['repo'], properties:{ repo:{ type:'string', description:'owner/repo format, e.g. "microsoft/vscode"' }, limit:{ type:'number', description:'Max releases (default 5)' } } } } },
  { type:'function', function:{ name:'get_npm_downloads', description:'Get download statistics for an npm package.', parameters:{ type:'object', required:['package'], properties:{ package:{ type:'string' }, period:{ type:'string', description:'last-day | last-week | last-month (default)' } } } } },
  { type:'function', function:{ name:'get_pypi_package', description:'Get details of a Python package from PyPI.', parameters:{ type:'object', required:['package'], properties:{ package:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_crate_info', description:'Get details of a Rust crate from crates.io.', parameters:{ type:'object', required:['crate'], properties:{ crate:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_dns_records', description:'Look up DNS records for a domain (A, AAAA, MX, TXT, CNAME, etc.) via Google DNS.', parameters:{ type:'object', required:['domain'], properties:{ domain:{ type:'string' }, type:{ type:'string', description:'Record type: A, AAAA, MX, TXT, CNAME, NS, etc. Default: A' } } } } },
  { type:'function', function:{ name:'check_ssl', description:'Check if a domain has a valid SSL certificate and measure response time.', parameters:{ type:'object', required:['domain'], properties:{ domain:{ type:'string', description:'Domain or URL to check' } } } } },
  { type:'function', function:{ name:'get_http_headers', description:'Fetch the HTTP response headers for a URL.', parameters:{ type:'object', required:['url'], properties:{ url:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_robots_txt', description:"Fetch a website's robots.txt file.", parameters:{ type:'object', required:['url'], properties:{ url:{ type:'string' } } } } },
  { type:'function', function:{ name:'search_github_repos', description:'Search GitHub repositories by keyword. Returns name, stars, language, description.', parameters:{ type:'object', required:['query'], properties:{ query:{ type:'string' }, sort:{ type:'string', description:'stars | forks | updated (default: stars)' }, limit:{ type:'number', description:'Max results (default 5)' } } } } },
  { type:'function', function:{ name:'get_github_issues', description:'List open or closed issues for a GitHub repository.', parameters:{ type:'object', required:['repo'], properties:{ repo:{ type:'string', description:'owner/repo' }, state:{ type:'string', description:'open | closed (default: open)' }, limit:{ type:'number', description:'Max issues (default 5)' } } } } },
  { type:'function', function:{ name:'get_npm_versions', description:'List recent versions of an npm package.', parameters:{ type:'object', required:['package'], properties:{ package:{ type:'string' } } } } },
  // FINANCE & MARKETS
  { type:'function', function:{ name:'get_fear_greed_index', description:'Get the current Crypto Fear & Greed Index (0=Extreme Fear, 100=Extreme Greed).', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_historical_exchange_rate', description:'Get a historical currency exchange rate for a specific date (Frankfurter API).', parameters:{ type:'object', required:['date','from','to'], properties:{ date:{ type:'string', description:'ISO date: YYYY-MM-DD' }, from:{ type:'string', description:'Currency code, e.g. USD' }, to:{ type:'string', description:'Currency code, e.g. EUR' } } } } },
  { type:'function', function:{ name:'get_currency_list', description:'Get a list of all supported currency codes and names.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_crypto_global_stats', description:'Get global cryptocurrency market stats: total market cap, BTC dominance, 24h volume.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_trending_crypto', description:'Get the currently trending cryptocurrencies on CoinGecko.', parameters:{ type:'object', required:[], properties:{} } } },
  { type:'function', function:{ name:'get_eth_gas_price', description:'Get current Ethereum gas prices in Gwei (slow, standard, fast).', parameters:{ type:'object', required:[], properties:{} } } },
  // WORLD & GEOGRAPHY
  { type:'function', function:{ name:'get_countries_by_region', description:'List all countries in a geographic region (Africa, Asia, Europe, Americas, Oceania).', parameters:{ type:'object', required:['region'], properties:{ region:{ type:'string', description:'Africa | Asia | Europe | Americas | Oceania' } } } } },
  { type:'function', function:{ name:'get_timezone_info', description:'Get current time and UTC offset for any IANA timezone.', parameters:{ type:'object', required:['timezone'], properties:{ timezone:{ type:'string', description:'IANA timezone, e.g. America/New_York, Europe/Paris' } } } } },
  { type:'function', function:{ name:'get_ip_country', description:'Get country, city, and ISP information for an IP address (or your own IP).', parameters:{ type:'object', required:[], properties:{ ip:{ type:'string', description:'IPv4 address. Omit for your own IP.' } } } } },
  { type:'function', function:{ name:'get_border_countries', description:'Get all countries that share a land border with a given country.', parameters:{ type:'object', required:['country'], properties:{ country:{ type:'string' } } } } },
  { type:'function', function:{ name:'get_weather_forecast', description:'Get a 3-day weather forecast for any city.', parameters:{ type:'object', required:['location'], properties:{ location:{ type:'string', description:'City or location name' } } } } },
  { type:'function', function:{ name:'get_air_quality', description:'Get air quality (PM2.5, PM10, CO2, ozone) for coordinates.', parameters:{ type:'object', required:[], properties:{ city:{ type:'string', description:'City name (used for display; coordinates default to global average)' } } } } },
  { type:'function', function:{ name:'get_uv_index', description:'Get the current UV index and risk level for GPS coordinates.', parameters:{ type:'object', required:[], properties:{ latitude:{ type:'number', description:'Default: New York' }, longitude:{ type:'number' } } } } },
];
