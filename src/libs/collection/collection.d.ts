export interface ICollection {
    id: number,
    title: string,
    status?: ICollectionStatus
    built_at?: string
    acquired_at?: string
    type: IType,
    release_type: IReleaseType
    manufacturer?: IManufacturer
    series?: ISeries
    cover: string
    pictures?: string[]
    addons?: ICollectionAddon[]
    description?: string
}

export interface ICollectionUpsertPayload {
    title: string
    status: ICollectionStatus
    built_at?: string
    acquired_at?: string
    cover: string
    grade_id: number
    release_type_id: number
    manufacturer_id: number
    series_id: number
    pictures?: string[]
    addons?: ICollectionAddonPayload[]
    description?: string
}

export interface ICollectionUploadPayload {
    title: string
    status: ICollectionStatus
    built_at?: string
    acquired_at?: string
    cover: File
    grade_id: number
    release_type_id: number
    manufacturer_id: number
    series_id: number
    pictures?: File[]
    addons?: ICollectionAddonPayload[]
    description?: string
}

export interface ICollectionDrawerContent {
    grades: IGradeDrawerItem[]
    release_types: IReleaseTypeDrawerItem[]
    manufacturers?: IManufacturerDrawerItem[]
    series: ISeriesDrawerItem[]
}

export interface ICollectionTypeFilterItem {
    id: number
    name: string
}

export interface IGradeDrawerItem {
    grade_id: number
    collection_type_name: string
    grade_short_name: string
    scale: string
}

export interface IReleaseTypeDrawerItem {
    id: number
    name: string
}

export interface ISeriesDrawerItem {
    id: number
    name: string
}

export interface IManufacturerDrawerItem {
    id: number
    name: string
}

export interface ICollectionAddon {
    id?: number
    name?: string
    manufacturer?: IManufacturer
}

export interface ICollectionAddonPayload {
    name: string
    manufacturer_id: number
}

interface IReleaseType {
    id: number
    name: string
}

interface IType {
    id: number
    name: string
    scale: string
    grade: IGrade
}

interface ISeries {
    id: number
    name: string
}

interface IManufacturer {
    id: number
    name: string
}

export interface IGrade {
    id: number
    name: string
    short_name: string
}

export interface ICollectionFilterQuery {
    collection_type_id?: number
    grade_id?: number
    release_type_id?: number[]
    sort?: string
    limit?: number
    offset?: number
}

export type ICollectionStatus = 0 | 1 | 2 | 3
