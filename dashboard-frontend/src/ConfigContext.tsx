import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./services/api";

export type AppConfig = {
  Demo1Start: string;
  Demo1End: string;
  Demo2Start: string;
  Demo2End: string;
  Demo3Start: string;
  Demo3End: string;
  Demo4Start: string;
  Demo4End: string;
  ExpectedCommitsWeekly: number;
  ExpectedMergesDemo: number;
  GITLAB_GROUP_NAME: string;
};

type ConfigContextType = {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  selectedDemo: string;
  setSelectedDemo: (demo: string) => void;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  error: null,
  selectedDemo: "Demo1",
  setSelectedDemo: () => {},
  updateConfig: async () => {},
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState("Demo 1");

  useEffect(() => {
    api.getConfig()
      .then(setConfig)
      .catch(() => setError("Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const updated = await api.setConfig(updates);
    setConfig(updated);
  };

  return (
  <ConfigContext.Provider value={{ config, updateConfig, loading, error, selectedDemo, setSelectedDemo }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  return ctx;
};