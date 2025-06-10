
export enum DimensionUnitsEnum {
  ft = 'feet',// TODO: not valid  in Shipstation
  in = "inches",
  cm = "centimeters",
}

export enum WeightUnitsEnum {
  lb = "pounds",
  oz = "ounces",
  g = "grams"
}

export type DimensionUnits = 
  'feet' | /* TODO: not valid  in Shipstation */ 
  'inches' |
  'centimeters';

export type WeightUnits = 
  'pounds' | 
  'ounces' | 
  'grams';