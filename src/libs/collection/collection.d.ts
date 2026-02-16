export interface ICollection {
    id: number,
    title: string,
    type: IType,
    release_type: IReleaseType
    cover: string
    pictures?: string[]
    description?: string
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

interface IGrade {
    id: number
    name: string
    short_name: string
}