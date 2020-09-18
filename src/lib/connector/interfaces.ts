import { EventEmitter } from "events";

export interface IConnector extends EventEmitter {
    run: () => void
}

export interface IConnectorConfig {
    url: string
    target: string[]
    interval: number
    update: boolean
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
    list: string[]
}

export interface IConnectorSource {
    getFile: (url: string) => Promise<IConnectorSourceFileResult>
    getList: (url: string) => Promise<IConnectorSourceListResult>
    getHashes: (files: string[]) => Promise<IConnectorSourceHashesResult[]>
}