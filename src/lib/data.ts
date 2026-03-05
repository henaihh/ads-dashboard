export type Platform = 'meta' | 'meli';

export interface AdSet {
  name: string;
  spent: number;
  conversions: number;
  roas: number;
  ctr: number;
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
