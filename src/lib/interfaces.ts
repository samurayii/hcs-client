export interface IAppConfig {
    url: string
    webhook?: string
    interval: number
    restart_interval: number
    exec: string
    target: string[]
    cwd: string
    update: boolean
}