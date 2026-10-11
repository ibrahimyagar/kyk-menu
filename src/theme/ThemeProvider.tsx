import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useTercih } from "../tercih/TercihProvider";
import { gece, gunduz, type Renkler } from "./tokens";

const TemaBaglami = createContext<Renkler>(gunduz);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const sistem = useColorScheme();
  const { tema } = useTercih();
  const renk = useMemo(() => {
    const geceMi = tema === "gece" || (tema === "sistem" && sistem === "dark");
    return geceMi ? gece : gunduz;
  }, [sistem, tema]);
  return <TemaBaglami.Provider value={renk}>{children}</TemaBaglami.Provider>;
}

export function useTema(): Renkler {
  return useContext(TemaBaglami);
}
