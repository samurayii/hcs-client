import { 
    IConnectorKeys,
    IConnectorSource, 
    IConnectorTarget, 
    IConnectorTargetConfig 
} from "../interfaces";
import * as path from "path";
import * as fs from "fs";
import { sync as sync_del } from "del";
import { ILogger } from "logger-flx";


export class ConnectorTarget implements IConnectorTarget {
    
    private _healthy_flag: boolean
    private readonly _full_tmp_path: string
    private _info: {
        target: string
        destination: string
        directory: boolean
        hash_file: string
        files: {
            [key: string]: {
                path: string
                check: boolean
                full_path: string
                hash: string
            }
        }
    }

    constructor (
        private readonly _id: string,
        private readonly _config: IConnectorTargetConfig,
        private readonly _keys: IConnectorKeys,
        private readonly _source: IConnectorSource,
        private readonly _logger: ILogger
    ) {
        this._healthy_flag = false;
        this._full_tmp_path = path.resolve(process.cwd(), this._config.tmp);

        const hash_file = `${this._config.target.replace(/(\/|\\|\:)/gi, "_")}-${this._config.destination.replace(/(\/|\\|\:)/gi, "_")}.json`;
        const full_hash_file = path.resolve(this._full_tmp_path, hash_file);

        if (fs.existsSync(full_hash_file)) {

            try {

                const target_body = fs.readFileSync(full_hash_file).toString();

                this._info = JSON.parse(target_body);

                this._logger.log(`[HCL-Client] Body hash for target "${this._config.target}" loaded from file "${full_hash_file}"`, "dev");

            } catch (error) {
                this._logger.error(`[HCL-Client] Problem synchronization. ${error}`);
                this._logger.error(error.stack, "debug");
                process.exit(1);
            }

        } else {

            this._info = {
                target: this._config.target,
                destination: this._config.destination,
                directory: false,
                hash_file: hash_file,
                files: {}
            };

        }

        for (const target_file_name in this._info.files) {

            const full_file_path =  this._info.files[target_file_name].full_path;

            if (!fs.existsSync(full_file_path)) {
                delete this._info.files[target_file_name];
                this._logger.warn(`[HCL-Client] File ${full_file_path} for target ${this._id} not found`);
            }

        }

        this._saveTargetHash();

    }

    async sync (): Promise<boolean> {

        this._logger.log(`[HCL-Client] Synchronization for target "${this._id}" running`, "dev");

        let update_files_flag = false;
        this._healthy_flag = true;

        for (const client_file_key in this._info.files) {
            this._info.files[client_file_key].check = false;
        }

        const target = this._info.target;
        const destination = this._info.destination;
        const client_files = this._info.files;

        try {

            const data = await this._source.getList(target);
            const directory_flag = data.directory;
            const files_list = data.list;

            if (files_list.length <= 0) {

                this._healthy_flag = false;
                
                this._logger.error(`For target "${this._id}" files list is empty`);

                if (fs.existsSync(destination)) {
                    sync_del(destination);
                    this._logger.warn(`[HCL-Client] Deleted destination ${destination}`, "dev");
                }

                if (Object.keys(this._info.files).length > 0) {
                    this._info.files = {};
                    this._saveTargetHash();
                    return true;
                }

                return false;

            } else {

                const hashes_list = await this._source.getHashes(files_list);

                for (const hashes_item of hashes_list) {

                    if (hashes_item.exist === false) {
                        continue;
                    }
    
                    if (client_files[hashes_item.file] !== undefined) {
    
                        const client_file = client_files[hashes_item.file];
    
                        client_file.check = true;
    
                        if (client_file.hash === hashes_item.hash) {
                            continue;
                        }
                    }
    
                    update_files_flag = true;
    
                    const data = await this._source.getFile(hashes_item.file);
                    const new_hash = hashes_item.hash;
                    
                    let full_file_path = destination;
    
                    if (directory_flag === true) {
                        full_file_path = path.resolve(destination, hashes_item.file.replace(`${this._config.target}/`,""));
                    }
    
                    this._saveFile(full_file_path, this._parseKeys(data.body));
    
                    client_files[hashes_item.file] = {
                        path: hashes_item.file,
                        check: true,
                        full_path: full_file_path,
                        hash: new_hash
                    };
                    
                }

            }

            for (const client_file_key in this._info.files) {
                if (this._info.files[client_file_key].check === false) {
                    this._deleteFile(this._info.files[client_file_key].full_path);
                    delete this._info.files[client_file_key];
                    update_files_flag = true;
                }
            }
    
            this._logger.log(`[HCL-Client] Synchronization for target "${this._id}" completed`, "dev");
    
            if (update_files_flag === true) {
                this._logger.log("[HCL-Client] Change detected on server", "dev");
                this._saveTargetHash();
                return true;
            } else {
                return false;
            }

        } catch (error) {
            this._healthy_flag = false;
            this._logger.error(`[HCL-Client] Problem synchronization for target ${this._id}. ${error}`);
            this._logger.log(error.stack, "debug");
            return false;
        }

    }

    private _saveTargetHash (): void {

        if (!fs.existsSync(this._full_tmp_path)) {
            fs.mkdirSync(this._full_tmp_path, {
                recursive: true
            });
            this._logger.log(`[HCL-Client] Tmp folder "${this._full_tmp_path}" created"`, "dev");
        }

        const files_list = [];

        const hash_file = this._info.hash_file;
        const full_hash_file = path.resolve(this._full_tmp_path, hash_file);
        const body = JSON.stringify(this._info, null, 4);

        try {

            this._saveFile(full_hash_file, body);
            files_list.push(hash_file);
            this._logger.log(`[HCL-Client] Body hash for target "${this._id}" saved to "${full_hash_file}"`, "dev");

        } catch (error) {
            this._logger.error(`[HCL-Client] Can not write body hash for target "${this._id}" to file "${full_hash_file}". ${error.message}`);
            this._logger.log(error.stack, "debug");
        }
        
    }

    private _saveFile (file_path: string, body: string): void {
     
        const dirname = path.dirname(file_path);

        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, {
                recursive: true
            });
        }

        fs.writeFileSync(file_path, body);

    }

    private _deleteFile (file_path: string): void {
        if (fs.existsSync(file_path)) {
            sync_del(file_path);
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

    get id (): string {
        return this._id;
    }
    get heathy (): boolean {
        return this._healthy_flag;
    }
}