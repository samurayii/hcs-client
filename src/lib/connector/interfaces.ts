import { EventEmitter } from "events";

export interface IConnector extends EventEmitter {
    run: () => Promise<void>
    stop: () => void
    readonly heathy: boolean
}

export interface IConnectorConfig {
    url: string
    target: string[]
    interval: number
    update: boolean
    tmp: string
    keys: string[]
}

export interface IConnectorSourceHashesResult {
    namespace: string
    exist: boolean
    file: string
    hash: string
}

export interface IConnectorSourceFileResult {
    namespace: string
    path: string
    body: string
}

export interface IConnectorSourceListResult {
    namespace: string
    path: string
    directory: boolean
    list: string[]
}

export interface IConnectorTargetConfig {
    target: string
    destination: string
    tmp: string
}

export interface IConnectorKeys {
    [key: string]: string
}

export interface IConnectorSource {
    getFile: (url: string) => Promise<IConnectorSourceFileResult>
    getList: (url: string) => Promise<IConnectorSourceListResult>
    getHashes: (files: string[]) => Promise<IConnectorSourceHashesResult[]>
}

export interface IConnectorTarget {
    sync: () => Promise<boolean>
    readonly heathy: boolean
    readonly id: string
}
