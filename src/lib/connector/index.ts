import { EventEmitter } from "events";
import { ILogger } from "logger-flx";
import { 
    IConnector, 
    IConnectorConfig, 
    IConnectorKeys,
    IConnectorTarget
} from "./interfaces";
import { HttpSource } from "./lib/http";
import * as path from "path";
import * as fs from "fs";
import jtomler from "jtomler";
import { ConnectorTarget } from "./lib/target";
import * as chalk from "chalk";

export * from "./interfaces";

export class Connector extends EventEmitter implements IConnector {

    private readonly _targets: {
        [key: string]: IConnectorTarget
    }
    private _running_flag: boolean
    private _stopping_flag: boolean
    private _id_interval: ReturnType<typeof setTimeout>

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILogger
    ) {

        super();

        this._targets = {};
        this._running_flag = false;
        this._stopping_flag = false;

        const keys = this._loadKeys();
        const source = new HttpSource(this._config.url, this._logger);

        for (const item of this._config.target) {

            let target = item.split(":")[0];
            let destination = item.split(":")[1];

            target = target.replace(/(^\/|\/$)/gi, "");
            destination = path.resolve(destination.replace(/\/$/gi, ""));
            
            this._targets[target] = new ConnectorTarget(target, {
                target: target,
                destination: destination,
                tmp: this._config.tmp
            }, keys, source, this._logger);

        }

    }

    stop (): void {

        if (this._stopping_flag === true) {
            return;
        }

        this._stopping_flag = true;

        clearTimeout(this._id_interval);

    }

    run (): Promise<void> {
        return new Promise( async (resolve) => {

            if (this._running_flag === true) {
                return resolve();
            }
    
            this._running_flag = true;

            try {
                await this._sync();
            } catch (error) {
                this._logger.error(`[HCL-Client] Problem synchronization. ${error}`);
                this._logger.error(error.stack, "debug");
            }
    
            this._running_flag = false;
    
            if (this._config.update === true && this._stopping_flag === false) {

                this._logger.log(`[HCL-Client] New cycle synchronization after ${this._config.interval} sec`, "dev");

                this._id_interval = setTimeout( () => {
                    this.run();
                }, this._config.interval * 1000);
            }

            resolve();

        });
    }

    async _sync (): Promise<void> {

        this._logger.log("[HCL-Client] Synchronization running", "dev");

        let change_flag = false;

        for (const target_id in this._targets) {

            const target = this._targets[target_id];
            const result = await target.sync();

            if (result === true) {
                change_flag = true;
            }

        }

        this._logger.log("[HCL-Client] Synchronization completed", "dev");

        if (change_flag === true) {
            this._logger.log(`[HCL-Client] ${chalk.cyan("Change detected on server")}`, "dev");
            this.emit("change");
        }

    }

    private _loadKeys (): IConnectorKeys {

        const keys: IConnectorKeys = {};

        for (const key_path of this._config.keys) {

            const full_key_path = path.resolve(process.cwd(), key_path.replace(/\/$/,""));

            if (!fs.existsSync(full_key_path)) {
                this._logger.error(`[HCL-Client] Key file ${chalk.grey(full_key_path)} not found`);
                process.exit(1);
            }

            let keys_file_text = fs.readFileSync(key_path).toString();

            this._logger.log(`[HCL-Client] Loading key file ${chalk.grey(key_path)}`, "dev");

            for (const env_name in process.env) {
    
                const env_arg = process.env[env_name];
                const reg = new RegExp("\\${"+env_name+"}", "gi");
    
                keys_file_text = keys_file_text.replace(reg, env_arg);
            }
            
            const keys_file_json = <IConnectorKeys>jtomler(keys_file_text, false);

            for (const key_name in keys_file_json) {

                if (!/^[a-zA-Z]{1}[-a-zA-Z0-9_]{0,31}$/gi.test(key_name)) {
                    this._logger.warn(`[HCL-Client] Key ${chalk.grey(key_name)} not match regexp ^[a-zA-Z]{1}[-a-zA-Z0-9_]{0,31}$`);
                    continue;
                }
    
                let value = keys_file_json[key_name];
    
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                if (typeof value === "boolean") {
                    if (value === true) {
                        value = "true";
                    } else {
                        value = "false";
                    }
                } else {
                    if (value === null) {
                        value = "null";
                    }
                    if (typeof value === "object") {
                        value = JSON.stringify(value);
                    }
                    if (typeof value !== "object") {
                        value = `${value}`;
                    }
                }

                keys[`client.${key_name}`] = value;

                this._logger.log(`[HCL-Client] Key ${chalk.grey(key_name)} initialized to ${chalk.grey(`client.${key_name}`)}`, "dev");

            }

        }

        return keys;

    }

    get heathy (): boolean {

        for (const target_id in this._targets) {
            const target = this._targets[target_id];
            if (target.heathy === false) {
                return false;
            }
        }

        return true;

    }
}