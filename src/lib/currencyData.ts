
import { Currency } from "./types";

export const currencies: Currency[] = [
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
  },
];

export const getDefaultCurrency = (): Currency => {
  return currencies.find(c => c.code === 'SGD') || currencies[0];
};
