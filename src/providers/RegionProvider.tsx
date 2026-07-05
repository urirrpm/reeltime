import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_REGION,
  REGIONS,
  type RegionOption,
} from '@/config/region';

const STORAGE_KEY = 'reeltime.region';

interface RegionContextValue {
  region: RegionOption;
  setRegion: (code: RegionOption['code']) => void;
}

const RegionContext = createContext<RegionContextValue>({
  region: DEFAULT_REGION,
  setRegion: () => {},
});

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionOption>(DEFAULT_REGION);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((code) => {
      const found = REGIONS.find((r) => r.code === code);
      if (found) setRegionState(found);
    });
  }, []);

  const setRegion = (code: RegionOption['code']) => {
    const found = REGIONS.find((r) => r.code === code);
    if (!found) return;
    setRegionState(found);
    AsyncStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export const useRegion = () => useContext(RegionContext);
