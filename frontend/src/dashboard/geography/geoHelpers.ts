export const MARKET_CENTERS: Record<string, [number, number]> = {
  Canada: [-105, 56],
  US: [-98, 38],
  LATAM: [-64, -15],
  EU: [12, 50],
  EMEA: [38, 28],
  Africa: [20, 0],
  APAC: [105, 18],
};

export const MARKET_CELLS: Record<string, { x: number; y: number; width: number; height: number }> = {
  Canada: { x: -138, y: 48, width: 62, height: 22 },
  US: { x: -128, y: 25, width: 58, height: 21 },
  LATAM: { x: -92, y: -52, width: 58, height: 65 },
  EU: { x: -10, y: 38, width: 42, height: 24 },
  EMEA: { x: 22, y: 18, width: 58, height: 24 },
  Africa: { x: -20, y: -34, width: 58, height: 48 },
  APAC: { x: 72, y: -40, width: 82, height: 82 },
};

const COUNTRY_COORDS: Record<string, [number, number]> = {
  Argentina: [-64, -34],
  Australia: [134, -25],
  Austria: [14, 47],
  Bangladesh: [90, 24],
  Belgium: [4, 51],
  Brazil: [-52, -10],
  Canada: [-106, 57],
  Chile: [-71, -30],
  China: [104, 35],
  Colombia: [-74, 4],
  Cuba: [-79, 22],
  Denmark: [10, 56],
  Egypt: [30, 27],
  France: [2, 46],
  Germany: [10, 51],
  Ghana: [-1, 8],
  India: [78, 22],
  Indonesia: [114, -3],
  Iran: [53, 32],
  Ireland: [-8, 53],
  Italy: [12, 43],
  Japan: [138, 37],
  Kenya: [38, 1],
  Malaysia: [102, 4],
  Mexico: [-102, 23],
  Morocco: [-7, 32],
  Netherlands: [5, 52],
  Nigeria: [8, 9],
  Pakistan: [70, 30],
  Peru: [-75, -10],
  Philippines: [122, 13],
  Poland: [20, 52],
  Russia: [90, 60],
  'Saudi Arabia': [45, 24],
  Senegal: [-14, 14],
  Singapore: [104, 1],
  'South Africa': [24, -29],
  'South Korea': [128, 36],
  Spain: [-4, 40],
  Sweden: [15, 62],
  Switzerland: [8, 47],
  Thailand: [101, 15],
  Turkey: [35, 39],
  Ukraine: [31, 49],
  'United Kingdom': [-2, 54],
  'United States': [-98, 39],
  Venezuela: [-66, 7],
  Vietnam: [108, 16],
};

const hashText = (value: string) =>
  value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

export const getCountryPoint = (country: string, market?: string): [number, number] => {
  const known = COUNTRY_COORDS[country];
  if (known) return known;

  const center = MARKET_CENTERS[market ?? ''] ?? [0, 0];
  const hash = hashText(country);
  const lonOffset = ((hash % 29) - 14) * 0.8;
  const latOffset = (((hash / 7) % 23) - 11) * 0.7;
  return [center[0] + lonOffset, center[1] + latOffset];
};

export const mapAxes = {
  xAxis: {
    type: 'value',
    min: -180,
    max: 180,
    axisLabel: { color: '#64748B', fontSize: 10, formatter: '{value}deg' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
  },
  yAxis: {
    type: 'value',
    min: -60,
    max: 80,
    axisLabel: { color: '#64748B', fontSize: 10, formatter: '{value}deg' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
  },
};
