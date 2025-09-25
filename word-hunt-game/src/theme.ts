export type WordType = "invalid" | "valid-used" | "valid-new";

export interface Theme {
  default: number;
  wordTypes: Record<WordType, number>;
}

const theme: Theme = {
  default: 0xefcc92,
  wordTypes: {
    invalid: 0xf8ead3,
    "valid-used": 0xf0f092,
    "valid-new": 0x92f092,
  },
};

export default theme;
