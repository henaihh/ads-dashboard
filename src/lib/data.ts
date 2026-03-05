export type Platform = 'meta' | 'meli';

export interface AdSet {
  name: string;
  spent: number;
  conversions: number;
  roas: number;
  ctr: number;
}

export interface DemographicSlice {
  label: string;
  value: number;
}

export interface Demographics {
  gender?: {
    impressions: DemographicSlice[];
    conversions: DemographicSlice[];
  };
  age?: {
    impressions: DemographicSlice[];
    conversions: DemographicSlice[];
  };
  region?: {
    impressions: DemographicSlice[];
    conversions: DemographicSlice[];
  };
}

export interface Campaign {
  id: number;
  platform: Platform;
  name: string;
  status: 'active' | 'paused';
  budget: number;
  spent: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  conversions: number;
  revenue: number;
  roas: number;
  costPerResult: number;
  trend: number[];
  trendLabels: string[];
  adSets: AdSet[];
  demographics?: Demographics;
  dailyBreakdown?: { date: string; spent: number; revenue: number; conversions: number; clicks: number; impressions: number }[];
}

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 1, platform: 'meta', name: 'Summer Sneakers - Lookalike', status: 'active',
    budget: 1200, spent: 847.32, impressions: 142500, reach: 98200, clicks: 3420,
    ctr: 2.4, cpc: 0.248, cpm: 5.95, frequency: 1.45, conversions: 89,
    revenue: 4628, roas: 5.46, costPerResult: 9.52,
    trend: [3.2, 4.1, 4.8, 5.1, 5.46], trendLabels: ['Lun','Mar','Mié','Jue','Vie'],
    adSets: [
      { name: 'Mujeres 25-34', spent: 312, conversions: 41, roas: 6.12, ctr: 3.1 },
      { name: 'Hombres 18-24', spent: 289, conversions: 28, roas: 4.51, ctr: 2.1 },
      { name: 'Retargeting', spent: 246, conversions: 20, roas: 5.85, ctr: 2.8 },
    ],
    demographics: {
      gender: {
        impressions: [
          { label: 'Mujeres', value: 78500 },
          { label: 'Hombres', value: 56200 },
          { label: 'Desconocido', value: 7800 },
        ],
        conversions: [
          { label: 'Mujeres', value: 52 },
          { label: 'Hombres', value: 31 },
          { label: 'Desconocido', value: 6 },
        ],
      },
      age: {
        impressions: [
          { label: '18-24', value: 31200 },
          { label: '25-34', value: 52100 },
          { label: '35-44', value: 34800 },
          { label: '45-54', value: 16200 },
          { label: '55-64', value: 6100 },
          { label: '65+', value: 2100 },
        ],
        conversions: [
          { label: '18-24', value: 12 },
          { label: '25-34', value: 38 },
          { label: '35-44', value: 25 },
          { label: '45-54', value: 11 },
          { label: '55-64', value: 2 },
          { label: '65+', value: 1 },
        ],
      },
      region: {
        impressions: [
          { label: 'Buenos Aires', value: 48200 },
          { label: 'CABA', value: 32100 },
          { label: 'Córdoba', value: 18500 },
          { label: 'Santa Fe', value: 14200 },
          { label: 'Mendoza', value: 9800 },
          { label: 'Tucumán', value: 6200 },
          { label: 'Entre Ríos', value: 4800 },
          { label: 'Otras', value: 8700 },
        ],
        conversions: [
          { label: 'Buenos Aires', value: 29 },
          { label: 'CABA', value: 21 },
          { label: 'Córdoba', value: 12 },
          { label: 'Santa Fe', value: 9 },
          { label: 'Mendoza', value: 5 },
          { label: 'Tucumán', value: 2 },
          { label: 'Entre Ríos', value: 1 },
          { label: 'Otras', value: 10 },
        ],
      },
    },
  },
  {
    id: 2, platform: 'meta', name: 'Brand Awareness - Video', status: 'active',
    budget: 800, spent: 623.10, impressions: 210000, reach: 156000, clicks: 1890,
    ctr: 0.9, cpc: 0.33, cpm: 2.97, frequency: 1.35, conversions: 12,
    revenue: 468, roas: 0.75, costPerResult: 51.93,
    trend: [1.1, 0.9, 0.8, 0.7, 0.75], trendLabels: ['Lun','Mar','Mié','Jue','Vie'],
    adSets: [
      { name: 'Interés Amplio', spent: 401, conversions: 6, roas: 0.55, ctr: 0.7 },
      { name: 'Audiencia Custom', spent: 222, conversions: 6, roas: 1.12, ctr: 1.3 },
    ],
    demographics: {
      gender: {
        impressions: [
          { label: 'Hombres', value: 105000 },
          { label: 'Mujeres', value: 92000 },
          { label: 'Desconocido', value: 13000 },
        ],
        conversions: [
          { label: 'Hombres', value: 7 },
          { label: 'Mujeres', value: 4 },
          { label: 'Desconocido', value: 1 },
        ],
      },
      age: {
        impressions: [
          { label: '18-24', value: 62000 },
          { label: '25-34', value: 74000 },
          { label: '35-44', value: 38000 },
          { label: '45-54', value: 21000 },
          { label: '55-64', value: 10000 },
          { label: '65+', value: 5000 },
        ],
        conversions: [
          { label: '18-24', value: 2 },
          { label: '25-34', value: 4 },
          { label: '35-44', value: 3 },
          { label: '45-54', value: 2 },
          { label: '55-64', value: 1 },
          { label: '65+', value: 0 },
        ],
      },
      region: {
        impressions: [
          { label: 'Buenos Aires', value: 72000 },
          { label: 'CABA', value: 51000 },
          { label: 'Córdoba', value: 28000 },
          { label: 'Santa Fe', value: 22000 },
          { label: 'Mendoza', value: 15000 },
          { label: 'Otras', value: 22000 },
        ],
        conversions: [
          { label: 'Buenos Aires', value: 4 },
          { label: 'CABA', value: 3 },
          { label: 'Córdoba', value: 2 },
          { label: 'Santa Fe', value: 1 },
          { label: 'Mendoza', value: 1 },
          { label: 'Otras', value: 1 },
        ],
      },
    },
  },
  {
    id: 3, platform: 'meta', name: 'Retargeting - Carrito Abandonado', status: 'active',
    budget: 500, spent: 412.55, impressions: 45000, reach: 32100, clicks: 2160,
    ctr: 4.8, cpc: 0.191, cpm: 9.17, frequency: 1.4, conversions: 156,
    revenue: 7020, roas: 17.02, costPerResult: 2.64,
    trend: [12.1, 14.3, 15.8, 16.1, 17.02], trendLabels: ['Lun','Mar','Mié','Jue','Vie'],
    adSets: [
      { name: 'Vio Producto', spent: 245, conversions: 98, roas: 18.2, ctr: 5.1 },
      { name: 'Agregó al Carrito', spent: 167, conversions: 58, roas: 15.4, ctr: 4.3 },
    ],
    demographics: {
      gender: {
        impressions: [
          { label: 'Mujeres', value: 24500 },
          { label: 'Hombres', value: 17800 },
          { label: 'Desconocido', value: 2700 },
        ],
        conversions: [
          { label: 'Mujeres', value: 89 },
          { label: 'Hombres', value: 58 },
          { label: 'Desconocido', value: 9 },
        ],
      },
      age: {
        impressions: [
          { label: '18-24', value: 5200 },
          { label: '25-34', value: 16800 },
          { label: '35-44', value: 12100 },
          { label: '45-54', value: 7200 },
          { label: '55-64', value: 2500 },
          { label: '65+', value: 1200 },
        ],
        conversions: [
          { label: '18-24', value: 18 },
          { label: '25-34', value: 67 },
          { label: '35-44', value: 44 },
          { label: '45-54', value: 19 },
          { label: '55-64', value: 6 },
          { label: '65+', value: 2 },
        ],
      },
      region: {
        impressions: [
          { label: 'Buenos Aires', value: 15800 },
          { label: 'CABA', value: 11200 },
          { label: 'Córdoba', value: 5900 },
          { label: 'Santa Fe', value: 4100 },
          { label: 'Mendoza', value: 3200 },
          { label: 'Otras', value: 4800 },
        ],
        conversions: [
          { label: 'Buenos Aires', value: 62 },
          { label: 'CABA', value: 45 },
          { label: 'Córdoba', value: 19 },
          { label: 'Santa Fe', value: 14 },
          { label: 'Mendoza', value: 9 },
          { label: 'Otras', value: 7 },
        ],
      },
    },
  },
  {
    id: 4, platform: 'meli', name: 'Product Ads - Zapatillas Running', status: 'active',
    budget: 50000, spent: 38200, impressions: 320000, reach: 215000, clicks: 9600,
    ctr: 3.0, cpc: 3.98, cpm: 119.38, frequency: 1.49, conversions: 204,
    revenue: 612000, roas: 16.02, costPerResult: 187.25,
    trend: [11.2, 13.1, 14.5, 15.2, 16.02], trendLabels: ['Lun','Mar','Mié','Jue','Vie'],
    adSets: [
      { name: 'Nike Air Max', spent: 15200, conversions: 92, roas: 18.1, ctr: 3.8 },
      { name: 'Adidas Ultraboost', spent: 12800, conversions: 68, roas: 15.9, ctr: 2.9 },
      { name: 'New Balance 990', spent: 10200, conversions: 44, roas: 12.9, ctr: 2.4 },
    ],
  },
  {
    id: 5, platform: 'meli', name: 'Product Ads - Sandalias Promo', status: 'paused',
    budget: 30000, spent: 28750, impressions: 185000, reach: 142000, clicks: 2960,
    ctr: 1.6, cpc: 9.71, cpm: 155.41, frequency: 1.3, conversions: 38,
    revenue: 45600, roas: 1.59, costPerResult: 756.58,
    trend: [2.8, 2.3, 1.9, 1.7, 1.59], trendLabels: ['Lun','Mar','Mié','Jue','Vie'],
    adSets: [
      { name: 'Havaianas', spent: 16200, conversions: 24, roas: 1.78, ctr: 1.9 },
      { name: 'Rider Sport', spent: 12550, conversions: 14, roas: 1.34, ctr: 1.2 },
    ],
  },
];
