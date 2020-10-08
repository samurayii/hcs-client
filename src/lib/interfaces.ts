export interface IAppConfig {
    url: string
    webhook?: string
    interval: number
    restart_interval: number
    exec: string
    target: string[]
    cwd: string
    update: boolean
    keys: string[]
    logs: string,
    critical: boolean,
    tmp: string
    [key: string]: string | number | string[] | boolean
}