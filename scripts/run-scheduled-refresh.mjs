const kind = process.argv[2];
const routes = { jobicy: "/api/scheduled/daily-vacancy-refresh", adzuna: "/api/scheduled/twice-daily-adzuna-cache-refresh", government: "/api/scheduled/weekly-government-department-refresh" };
if (!routes[kind]) throw new Error("Usage: node scripts/run-scheduled-refresh.mjs jobicy|adzuna|government");
const response = await fetch(`${process.env.API_URL}${routes[kind]}`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
const body = await response.text();
if (!response.ok) throw new Error(`${response.status}: ${body}`);
console.log(body);
