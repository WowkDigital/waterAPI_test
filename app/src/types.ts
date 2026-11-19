export type LatLngTuple = [number, number];

export interface ParcelData {
  id: string;
  commune: string;
  region: string;
  number: string;
  teryt: string;
  rings: LatLngTuple[][][];
  points: LatLngTuple[];
  areaHa: number;
  center: LatLngTuple;
}

export interface TerrainSample {
  point: LatLngTuple;
  elevationM: number;
}

export interface TerrainSummary {
  lowest: TerrainSample;
  highest: TerrainSample;
  deltaM: number;
  slopePct: number;
  directionLabel: string;
}

export interface Forecast48h {
  time: string[];
  precipitation: number[];
  et0_fao_evapotranspiration: number[];
  vapour_pressure_deficit: number[];
  soil_moisture_0_to_1cm: number[];
  soil_temperature_0cm: number[];
}

export interface ImgwSummary {
  localWarnings: Array<{ nazwa_zdarzenia: string; stopien: string; tresc: string }>;
  hydroCount: number;
  stationLabel: string;
}

export type SatelliteMode = "stress" | "ndmi" | "ndvi" | "none";

export interface SatelliteGrid {
  cols: number;
  rows: number;
  bounds: { south: number; west: number; north: number; east: number };
  ndvi: Float32Array;
  ndmi: Float32Array;
  lst: Float32Array;
  cloud: Uint8Array;
  s2Meta: { id: string; datetime: string; cloudCover: number; epsg: number };
  lsMeta: { id: string; datetime: string; cloudCover: number } | null;
  loadMs: number;
}

export interface SatelliteStats {
  pixels: number;
  ndvi: number;
  ndmi: number;
  lstC: number | null;
  stress: number;
  hotSharePct: number;
}

export interface SoilConfig {
  id: "1" | "2" | "3" | "4";
  label: string;
  retention: number;
  droughtThresholdMm: number;
  wodRange: string;
}

export interface SavedField {
  id: string;
  parcel: ParcelData;
  soil: SoilConfig["id"];
}

export type PactStatus = "idle" | "proposed" | "signed";
