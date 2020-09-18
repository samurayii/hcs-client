import { EventEmitter } from "events";
import { ILogger } from "logger-flx";
import { 
    IConnector, 
    IConnectorConfig, 
    IConnectorSource 
} from "./interfaces";
import { HttpSource } from "./lib/http";
import * as path from "path";
import * as fs from "fs";

export * from "./interfaces";

export class Connector extends EventEmitter implements IConnector {

    private readonly _targets: {
        [key: string]: {
            target: string
            destination: string
            files: {
                [key: string]: {
                    exist: boolean
                    file: string
                    hash: string
                }
            }
        }   
    }
    private readonly _source: IConnectorSource

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILogger
    ) {

        super();

        this._targets = {};

        for (const item of this._config.target) {

            let target = item.split(":")[0];
            let destination = item.split(":")[1];

            target = target.replace(/(^\/|\/$)/gi, "");
            destination = destination.replace(/\/$/gi, "");

            this._targets.push({
                target: target,
                destination: destination,
                files: {}
            });

        }

        this._source = new HttpSource(this._config.url, this._logger);

    }

    run (): void {
        
        console.log("run");



    }

    async _sync (): Promise<void> {

        let update_files_flag = false;

        for (const item_targets of this._targets) {

            const target = item_targets.target;
            const destination = item_targets.destination;
            const client_files = item_targets.files;

            try {

                const server_version = {};

                const data = await this._source.getList(target);
                const files_list = data.list;
                const hashes_list = await this._source.getHashes(files_list);
    
                for (const item of hashes_list) {

                    if (this._targets) {

                    }





                }
    
            } catch (error) {
                this._logger.error(`Synchronization problem for target ${target}`);
                break;
            }

        }
/*
        if (update_files_flag === true) {
            this.emit("change");
        }
*/
    }

    _saveFileFromServer (target: string, destination: string): void {

    }

    _watch (): void {
        console.log("watch");
    }

/*
    target: string[]
    interval: number
    update: boolean
*/


}