import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ParsedData } from '@/lib/fileParser';
import { SimConfig, SimResults } from '@/lib/simulation';

interface SimContextType {
  parsedData: ParsedData | null;
  setParsedData: (d: ParsedData | null) => void;
  config: SimConfig;
  setConfig: (c: SimConfig) => void;
  results: SimResults | null;
  setResults: (r: SimResults | null) => void;
}

const defaultConfig: SimConfig = {
  populationSize: 50,
  generations: 100,
  mutationRate: 0.05,
  crossoverProb: 0.8,
  rotationAngle: 0.05,
  numVMs: 10,
  vmMIPS: 1000,
  energyModel: 'Linear',
};

const SimContext = createContext<SimContextType | undefined>(undefined);

export function SimProvider({ children }: { children: ReactNode }) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [config, setConfig] = useState<SimConfig>(defaultConfig);
  const [results, setResults] = useState<SimResults | null>(null);

  return (
    <SimContext.Provider value={{ parsedData, setParsedData, config, setConfig, results, setResults }}>
      {children}
    </SimContext.Provider>
  );
}

export function useSimContext() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useSimContext must be inside SimProvider');
  return ctx;
}
