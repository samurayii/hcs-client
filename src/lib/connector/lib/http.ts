import { ILogger } from "logger-flx";
import { 
    IConnectorSource, 
    IConnectorSourceFileResult, 
    IConnectorSourceHashesResult, 
    IConnectorSourceListResult 
} from "../interfaces";
import fetch from "node-fetch";
import * as chalk from "chalk";

export class HttpSource implements IConnectorSource {

    constructor (
        private readonly _url_server: string,
        private readonly _logger: ILogger
    ) {
        this._url_server = this._url_server.replace(/\/$/gi, "");
    }

    getList (url_file: string): Promise<IConnectorSourceListResult> {
        return new Promise( (resolve, reject) => {

            const url = `${this._url_server}/v1/store/list/${url_file}`;

            this._logger.log(`[HCL-Client] Request: ${chalk.grey(url)}`, "dev");

            fetch(url).then( (response) => {

                if (response.ok === false) {
                    return reject(new Error (`Http request return ${response.status}. ${response.statusText}`));
                }

                return response.json();

            }).then( (body) => {

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getList for path ${url_file} return status ${body.status}`));

            }).catch( (error) => {
                reject(error);
            });

        });
    }

    getFile (url_file: string): Promise<IConnectorSourceFileResult> {
        return new Promise( (resolve, reject) => {

            const url = `${this._url_server}/v1/store/get/${url_file}`;

            this._logger.log(`[HCL-Client] Request: ${chalk.grey(url)}`, "dev");

            fetch(url).then( (response) => {

                if (response.ok === false) {
                    return reject(new Error (`Http request return ${response.status}. ${response.statusText}`));
                }

                return response.json();

            }).then( (body) => {

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getFile for path "${url_file}" return status ${body.status}`));

            }).catch( (error) => {
                reject(error);
            });
            
        });
    }

    getHashes (url_files: string[]): Promise<IConnectorSourceHashesResult[]> {
        return new Promise( (resolve, reject) => {

            const url = `${this._url_server}/v1/store/hashes`;

            this._logger.log(`[HCL-Client] Request: ${chalk.grey(url)}`, "dev");

            fetch(url, {
                method: "post",
                body: JSON.stringify(url_files),
                headers: {
                    "Content-Type": "application/json"
                }
            }).then( (response) => {

                if (response.ok === false) {
                    return reject(new Error (`Http request return ${response.status}. ${response.statusText}`));
                }

                return response.json();

            }).then( (body) => {

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getHashes return status "${body.status}"`));

            }).catch( (error) => {
                reject(error);
            });

        });
    }

}