import { EventEmitter } from "events";
import { ILogger } from "logger-flx";
import { 
    IConnector, 
    IConnectorConfig, 
    IConnectorKeys, 
    IConnectorSource 
} from "./interfaces";
import { HttpSource } from "./lib/http";
import * as path from "path";
import * as fs from "fs";
import jtomler from "jtomler";

export * from "./interfaces";

export class Connector extends EventEmitter implements IConnector {

    private readonly _targets: {
        [key: string]: {
            target: string,
            destination: string,
            files: {
                [key: string]: {
                    path: string
                    check: boolean
                    full_path: string
                    hash: string
                }
            }
        }   
    }
    private readonly _source: IConnectorSource
    private _running_flag: boolean
    private _stopping_flag: boolean
    private _id_interval: ReturnType<typeof setTimeout>
    private _keys: IConnectorKeys

    constructor (
        private readonly _config: IConnectorConfig,
        private readonly _logger: ILogger
    ) {

        super();

        this._targets = {};
        this._running_flag = false;
        this._stopping_flag = false;
        this._keys = {};

        for (const item of this._config.target) {

            let target = item.split(":")[0];
            let destination = item.split(":")[1];

            target = target.replace(/(^\/|\/$)/gi, "");
            destination = path.resolve(destination.replace(/\/$/gi, ""));

            this._targets[target] = {
                target: target,
                destination: destination,
                files: {}
            };

        }

        this._loadKeys();

        this._source = new HttpSource(this._config.url, this._logger);

    }

    stop (): void {

        if (this._stopping_flag === true) {
            return;
        }

        this._stopping_flag = true;

        clearTimeout(this._id_interval);

    }

    run (): void {

        if (this._running_flag === true) {
            return;
        }

        this._running_flag = true;

        this._sync().catch( (error) => {
            this._logger.error(`[Connector] Problem synchronization. ${error}`);
            this._logger.error(error.stack, "debug");
        }).finally( () => {

            this._running_flag = false;

            if (this._config.update === true && this._stopping_flag === false) {
                this._id_interval = setInterval( () => {
                    this.run();
                }, this._config.interval * 1000);
            }

        });
    }

    async _sync (): Promise<void> {

        let update_files_flag = false;

        for (const target_name in this._targets) {
            const targets_item = this._targets[target_name];
            for (const client_file_key in targets_item.files) {
                targets_item.files[client_file_key].check = false;
            }
        }


        for (const target_name in this._targets) {

            const targets_item = this._targets[target_name];
            const target = targets_item.target;
            const destination = targets_item.destination;
            const client_files = targets_item.files;

            try {

                const data = await this._source.getList(target);
                const directory_flag = data.directory;
                const files_list = data.list;
                const hashes_list = await this._source.getHashes(files_list);
                
                for (const hashes_item of hashes_list) {

                    if (hashes_item.exist === false) {
                        break;
                    }

                    let new_file_flag = false;

                    if (client_files[hashes_item.file] === undefined) {
                        new_file_flag = true;
                    } else {

                        const client_file = client_files[hashes_item.file];

                        client_file.check = true;

                        if (client_file.hash === hashes_item.hash) {
                            break;
                        } else {
                            update_files_flag = true;
                        }
                    }

                    if (new_file_flag === false) {
                        break;
                    }

                    update_files_flag = true;

                    const data = await this._source.getFile(hashes_item.file);
                    const new_hash = hashes_item.hash;
                    
                    let full_file_path = destination;

                    if (directory_flag === true) {
                        full_file_path = path.resolve(destination, hashes_item.file.replace(`${target_name}/`,""));
                    }

                    this._saveFile(data.body, full_file_path);

                    client_files[hashes_item.file] = {
                        path: hashes_item.file,
                        check: true,
                        full_path: full_file_path,
                        hash: new_hash
                    };
                    
                }          
    
            } catch (error) {
                this._logger.error(`[Connector] Synchronization problem for target ${target}. ${error}`);
                this._logger.log(error.stack, "debug");
                break;
            }

        }

        for (const target_name in this._targets) {
            const targets_item = this._targets[target_name];
            for (const client_file_key in targets_item.files) {
                if (targets_item.files[client_file_key].check === false) {
                    this._deleteFile(targets_item.files[client_file_key].full_path);
                    delete targets_item.files[client_file_key];
                    update_files_flag = true;
                }
            }
        }

        if (update_files_flag === true) {
            this.emit("change");
        }

    }

    private _saveFile (body: string, file_path: string): void {
        
        const dirname = path.dirname(file_path);

        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {
                recursive: true
            });
        }

        body = this._parseKeys(body);

        fs.writeFileSync(file_path, body);

    }

    private _deleteFile (file_path: string): void {
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
        }
    }

    private _loadKeys (): void {

        for (const key_path of this._config.keys) {

            const full_key_path = path.resolve(process.cwd(), key_path.replace(/\/$/,""));

            if (!fs.existsSync(full_key_path)) {
                this._logger.error(`[Connector] Key file ${full_key_path} not found`);
                process.exit(1);
            }

            let keys_file_text = fs.readFileSync(key_path).toString();

            this._logger.log(`[Connector] Loading key file ${key_path}`, "dev");

            for (const env_name in process.env) {
    
                const env_arg = process.env[env_name];
                const reg = new RegExp("\\${"+env_name+"}", "gi");
    
                keys_file_text = keys_file_text.replace(reg, env_arg);
            }
            
            const keys_file_json = <IConnectorKeys>jtomler(keys_file_text, false);

            for (const key_name in keys_file_json) {

                if (!/^[a-zA-Z]{1}[-a-zA-Z0-9_]{0,31}$/gi.test(key_name)) {
                    this._logger.warn(`[Connector] Key ${key_name} not match regexp ^[a-zA-Z]{1}[-a-zA-Z0-9_]{0,31}$`);
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

                this._keys[`client.${key_name}`] = value;

            }

        }

    }

    private _parseKeys (body: string): string {

        for (const key_name in this._keys) {

            const key = this._keys[key_name];
            const reg = new RegExp(`<<${key_name}>>`, "gi");

            body = body.replace(reg, key);

        }

        return body;
    }
}