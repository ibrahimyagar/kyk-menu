export const bosluk = { x1: 4, x2: 8, x3: 12, x4: 16, x6: 24, x8: 32 } as const;
export const yaricap = { kucuk: 12, orta: 16, buyuk: 24 } as const;

export interface Renkler {
  ad: "gunduz" | "gece";
  bg: string;
  yuzey: string;
  yuzey2: string;
  kenar: string;
  metin: string;
  soluk: string;
  aksan: string;
  aksanMetin: string;
  /** Vurgunun yüzeye yakın, yazı taşımayan tonu: şerit ve seçili arka plan. */
  aksanZemin: string;
}

export const gunduz: Renkler = {
  ad: "gunduz",
  bg: "#F6F4F0",
  yuzey: "#FBFAF8",
  yuzey2: "#E7E3DC",
  kenar: "#E7E3DC",
  metin: "#2A2F33",
  soluk: "#5E666D",
  aksan: "#A33E38",
  aksanMetin: "#FFFFFF",
  aksanZemin: "#F0DEDA",
};

export const gece: Renkler = {
  ad: "gece",
  bg: "#14171A",
  yuzey: "#1D2125",
  yuzey2: "#252A2F",
  kenar: "#32383E",
  metin: "#E4E6E8",
  soluk: "#B7C0C7",
  aksan: "#E99086",
  aksanMetin: "#14171A",
  aksanZemin: "#3A2B2A",
};
