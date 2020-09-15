export interface IAppConfig {
    url: string
    webhook?: string
    interval: number
    exec: string
    target: string[]
    cwd: string
    update: boolean
}