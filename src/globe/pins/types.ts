export type CountryPinMeta = {
  companyCount: number;
};

export type CountryPinResponse = {
  countries: Record<string, CountryPinMeta>;
};

export type CountryPinData = Record<string, CountryPinMeta>;
