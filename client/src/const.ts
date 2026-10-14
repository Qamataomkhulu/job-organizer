import { apiUrl } from "./lib/api";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = () => {
  const returnTo = window.location.origin + window.location.pathname + window.location.search + window.location.hash;
  const url = new URL(apiUrl("/api/oauth/start"), window.location.href);
  url.searchParams.set("returnTo", returnTo);
  window.location.href = url.toString();
};
