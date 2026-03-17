export interface ICollection {
    id: number,
    title: string,
    status?: ICollectionStatus
    built_at?: string
    type: IType,
    release_type: IReleaseType
    manufacturer?: IManufacturer
    series?: ISeries
    cover: string
    pictures?: string[]
    description?: string
}

export interface ICollectionUpsertPayload {
    title: string
    status: ICollectionStatus
    built_at?: string
    cover: string
    grade_id: number
    release_type_id: number
    manufacturer_id: number
    series_id: number
    pictures?: string[]
    description?: string
}

export interface ICollectionUploadPayload {
    title: string
    status: ICollectionStatus
    built_at?: string
    cover: File
    grade_id: number
    release_type_id: number
    manufacturer_id: number
    series_id: number
    pictures?: File[]
    description?: string
}

export interface ICollectionDrawerContent {
    collection_types: ICollectionTypeDrawerItem[]
    release_types: IReleaseTypeDrawerItem[]
    manufacturers?: IManufacturerDrawerItem[]
    series: ISeriesDrawerItem[]
}

export interface ICollectionTypeFilterItem {
    id: number
    name: string
}

export interface ICollectionTypeDrawerItem {
    id: number
    name: string
    grades: IGrade[]
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
    limit?: number
    offset?: number
}

export type ICollectionStatus = 0 | 1 | 2 | 3
