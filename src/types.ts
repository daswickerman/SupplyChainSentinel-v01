export interface Manufacturer {
  id: string;
  name: string;
  headquarters: string;
  techType: string;
  description: string;
  threatActors?: string[];
  createdAt: number;
}

export interface SupplyChainLocation {
  id: string;
  manufacturerId: string;
  type: 'Assembly' | 'Component Sourcing' | 'Raw Materials' | 'R&D' | 'Distribution';
  country: string;
  details: string;
}

export interface RiskReport {
  id: string;
  manufacturerId: string;
  riskScore: number;
  summary: string;
  keyRisks: string[];
  mitigationStrategies: string[];
  threatActorLinks?: string[];
  assessedAt: number;
}
