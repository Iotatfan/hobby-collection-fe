export interface ICollection {
  id: number;
  title: string;
  status?: ICollectionStatus;
  built_at?: string;
  acquired_at?: string;
  type: IType;
  release_type: IReleaseType;
  manufacturer?: IManufacturer;
  series?: ISeries;
  cover: string;
  pictures?: string[];
  addons?: ICollectionAddon[];
  description?: string;
  features?: IMetadataTag[];
  modifications?: IMetadataTag[];
  display_size?: IDisplaySize
}

export interface ICollectionUpsertPayload {
  title: string;
  status: ICollectionStatus;
  built_at?: string;
  acquired_at?: string;
  cover: string;
  grade_id: number;
  scale_id: number;
  release_type_id: number;
  manufacturer_id: number;
  series_id: number;
  pictures?: string[];
  addons?: ICollectionAddonPayload[];
  description?: string;
  features?: number[];
  modifications?: number[];
  display_size?: IDisplaySize
}

export interface ICollectionUploadPayload {
  title: string;
  status: ICollectionStatus;
  built_at?: string;
  acquired_at?: string;
  cover: File;
  grade_id: number;
  scale_id: number;
  release_type_id: number;
  manufacturer_id: number;
  series_id: number;
  pictures?: File[];
  addons?: ICollectionAddonPayload[];
  description?: string;
  features?: number[];
  modifications?: number[];
  display_size?: IDisplaySize
}

export interface ICollectionDrawerContent {
  collection_types: ICollectionTypeItem[];
  grades: IGradeDrawerItem[];
  scales: IFiguresScaleFilterItem[];
  release_types: IReleaseTypeDrawerItem[];
  manufacturers?: IManufacturerDrawerItem[];
  series: ISeriesDrawerItem[];
  features?: IMetadataTag[];
  modifications?: IMetadataTag[];
}

export interface IMetadataTag {
  id: number;
  slug: string;
  name: string;
  type: number;
}

export interface ICollectionTypeItem {
  id: number;
  name: string;
}

export interface ICollectionTypeFilterItem {
  id: number;
  name: string;
}

export interface IGunplaGradeFilterItem {
  id: number;
  name: string;
}

export interface IFiguresScaleFilterItem {
  id: number;
  name: string;
}

export interface ICollectionFilterOptions {
  collection_types: ICollectionTypeFilterItem[];
  release_types: IReleaseTypeDrawerItem[];
  gunpla_grades: IGunplaGradeFilterItem[];
  figures_scales: IFiguresScaleFilterItem[];
}

export interface IGradeDrawerItem {
  grade_id: number;
  collection_type_name: string;
  grade_short_name: string;
}

export interface IReleaseTypeDrawerItem {
  id: number;
  name: string;
}

export interface ISeriesDrawerItem {
  id: number;
  name: string;
}

export interface IManufacturerDrawerItem {
  id: number;
  name: string;
}

export interface ICollectionAddon {
  id?: number;
  name?: string;
  manufacturer?: IManufacturer;
}

export interface ICollectionAddonPayload {
  name: string;
  manufacturer_id: number;
}

interface IReleaseType {
  id: number;
  name: string;
}

interface IType {
  id: number;
  name: string;
  scale: string;
  grade: IGrade;
}

interface ISeries {
  id: number;
  name: string;
}

interface IManufacturer {
  id: number;
  name: string;
}

export interface IGrade {
  id: number;
  name: string;
  short_name: string;
}

export interface ICollectionFilterQuery {
  collection_type_id?: number;
  grade_id?: number;
  scale_id?: number;
  release_type_id?: number[];
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface ICollectionStatistics {
  total_count: number;
  completed_count: number;
  backlog_count: number;
  limited_count: number;
}

export type ICollectionStatus = 0 | 1 | 2 | 3;

export type IDisplaySize =
  | 'small_wide'
  | 'small_tall'
  | 'medium_wide'
  | 'medium_tall'
  | 'large_wide'
  | 'large_tall';

export interface IShelfItem {
  id: number;
  title: string;
  type: IType;
  status: ICollectionStatus;
  cover: string;
  display_size: IDisplaySize;
}

export interface IShelf {
  id: number;
  name: string;
  items: IShelfItem[];
  count: number;
}

export interface ICollectionShelf {
  gunpla_shelf: IShelf;
  figure_shelf: IShelf;
  other_model_kit_shelf: IShelf;
  backlog_shelf: IShelf;
}
