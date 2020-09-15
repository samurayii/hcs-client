import { EventEmitter } from "events";

export interface IStarter extends EventEmitter {
    run: () => void
    stop: () => void
    restart: () => void
    readonly close: boolean
}