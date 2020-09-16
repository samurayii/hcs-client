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

export interface IConnectorSource {
    //getFile: (url: string) => Promise<string>
    getList: (url: string) => Promise<string[]>
    /*
    getHashes: (files: string[]) => Promise<{
        exist: boolean
        file: string
        hash: string
    }[]>
    */
}