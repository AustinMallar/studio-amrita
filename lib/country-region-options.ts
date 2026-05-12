import { allCountries } from "country-region-data";

export type CountryOption = { code: string; name: string };
export type RegionOption = { code: string; name: string };

/** Sorted country list for `<select>` (ISO 3166-1 alpha-2 codes). */
export function getCountryOptions(): CountryOption[] {
  return allCountries
    .map(([name, code]) => ({ name, code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Regions/states/provinces for a country code, or empty if none in dataset. */
export function getRegionOptions(countryCode: string): RegionOption[] {
  const cc = countryCode.trim().toUpperCase();
  const row = allCountries.find(([, code]) => code === cc);
  if (!row) return [];
  const regions = row[2];
  return regions
    .map(([name, code]) => ({ name, code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
