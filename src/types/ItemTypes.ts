export interface ItemData {
  id: string;
  name: string;
  weight: number;
  color: number;
  iconLetter: string;
}

// Словарь всех типов предметов в игре
export const ITEMS: Record<string, ItemData> = {
  coin: {
    id: "coin",
    name: "Монета",
    weight: 1,
    color: 0xf1c40f,
    iconLetter: "М",
  },
  gem: {
    id: "gem",
    name: "Самоцвет",
    weight: 3,
    color: 0x9b59b6,
    iconLetter: "С",
  },
  key: {
    id: "key",
    name: "Ключ",
    weight: 2,
    color: 0xe67e22,
    iconLetter: "К",
  },
  potion: {
    id: "potion",
    name: "Зелье",
    weight: 1,
    color: 0x2ecc71,
    iconLetter: "З",
  },
  crystal: {
    id: "crystal",
    name: "Кристалл",
    weight: 4,
    color: 0x3498db,
    iconLetter: "Кр",
  },
};
