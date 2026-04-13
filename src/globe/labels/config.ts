import { CountryLabelsLayerOptions } from './countryLabelsLayer';

export const LABELS_CONFIG: Omit<CountryLabelsLayerOptions, 'getZoomNormalized' | 'container'> = {
  farMinImportance: 0.9,
  nearMinImportance: 0.55,
  horizonHysteresis: 0.01,
  importanceHysteresis: 0.03,
  horizonMargin: 0.02,
  maxHorizonDot: 0.9,
  maxVisible: 15
};
