import type {
  ICollection,
  ICollectionDrawerContent,
  ICollectionTypeFilterItem,
} from "../../src/libs/collection/collection";

export const collectionTypeFiltersFixture: ICollectionTypeFilterItem[] = [
  { id: 11, name: "Gunpla" },
  { id: 12, name: "Figure-rise" },
];

export const drawerContentFixture: ICollectionDrawerContent = {
  grades: [
    {
      grade_id: 101,
      collection_type_name: "Gunpla",
      grade_short_name: "HG",
      scale: "1/144",
    },
  ],
  release_types: [
    { id: 201, name: "Regular" },
    { id: 202, name: "P-Bandai" },
  ],
  manufacturers: [{ id: 301, name: "Bandai" }],
  series: [{ id: 401, name: "UC" }],
};

export const collectionsFixture: ICollection[] = [
  {
    id: 1,
    title: "RX-78-2 Gundam",
    status: 3,
    built_at: "2026-02-15T00:00:00.000Z",
    type: {
      id: 1,
      name: "Gunpla",
      scale: "1/144",
      grade: { id: 101, name: "High Grade", short_name: "HG" },
    },
    release_type: { id: 201, name: "Regular" },
    manufacturer: { id: 301, name: "Bandai" },
    series: { id: 401, name: "UC" },
    cover: "https://example.com/images/rx-78-2.jpg",
    pictures: ["https://example.com/images/rx-78-2-1.jpg"],
    description: "Starter fixture collection item.",
  },
];
