import { EventEmitter } from "events";

export interface IStarter extends EventEmitter {
    run: () => void
    stop: () => void
    restart: () => void
    readonly close: boolean
}

export interface IStarterConfig {
    exec: string
    cwd: string
    restart_interval: number
    webhook?: string
    shell: boolean
}