import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { ParsedData } from "@/lib/fileParser";
import {
  DEFAULT_SEED,
  type SimConfig,
  type SimResults,
} from "@/lib/simulation";

interface SimContextType {
  parsedData: ParsedData | null;
  setParsedData: (
    data: ParsedData | null
  ) => void;

  config: SimConfig;
  setConfig: (
    config: SimConfig
  ) => void;

  results: SimResults | null;
  setResults: (
    results: SimResults | null
  ) => void;
}

const defaultConfig: SimConfig = {
  populationSize: 50,
  generations: 100,
  mutationRate: 0.05,
  crossoverProb: 0.8,
  rotationAngle: 0.05,
  numVMs: 10,
  vmMIPS: 1000,
  energyModel: "Linear",
  seed: DEFAULT_SEED,
};

const SimContext =
  createContext<
    SimContextType | undefined
  >(undefined);

export function SimProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [
    parsedData,
    setParsedData
  ] =
    useState<ParsedData | null>(
      null
    );

  const [
    config,
    setConfig
  ] =
    useState<SimConfig>(
      defaultConfig
    );

  const [
    results,
    setResults
  ] =
    useState<SimResults | null>(
      null
    );

  return (
    <SimContext.Provider
      value={{
        parsedData,
        setParsedData,
        config,
        setConfig,
        results,
        setResults,
      }}
    >
      {children}
    </SimContext.Provider>
  );
}

// This hook intentionally lives with its provider because it is part
// of the SimulationContext public API.
// eslint-disable-next-line react-refresh/only-export-components
export function useSimContext() {

  const context =
    useContext(
      SimContext
    );

  if (!context) {
    throw new Error(
      "useSimContext must be inside SimProvider"
    );
  }

  return context;
}