import { EventEmitter } from "events";
import { ILogger } from "logger-flx";
import { 
    IConnector, 
    IConnectorConfig, 
    IConnectorSource 
} from "./interfaces";
import { HttpSource } from "./lib/http";

export * from "./interfaces";

export class Connector extends EventEmitter implements IConnector {

    private readonly _target: {
        [key: string]: string
    }
    private readonly _source: IConnectorSource

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILogger
    ) {

        super();

        this._target = {};

        for (const item of this._config.target) {

            let target = item.split(":")[0];
            let destination = item.split(":")[1];

            target = target.replace(/(^\/|\/$)/gi, "");
            destination = destination.replace(/(^\/|\/$)/gi, "");

            this._target[target] = destination;

        }

        this._source = new HttpSource(this._config.url, this._logger);

    }

    run (): void {
        
        console.log("run");



    }


}