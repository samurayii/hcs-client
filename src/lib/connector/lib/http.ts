import { ILogger } from "logger-flx";
import { IConnectorSource, IConnectorSourceFileResult, IConnectorSourceHashesResult, IConnectorSourceListResult } from "../interfaces";
import axios from "axios";

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

            axios.get(url).then( (response) => {

                const body = response.data;

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getList for path ${url_file} return status ${body.status}`));

            }).catch( (error) => {
                if (error.response) {
                    reject(new Error(`Request to ${url_file} return code ${error.response.status}`));
                } else {
                    if (error.request) {
                        reject(error.request);
                    } else {
                        reject(error);
                    }
                }
            });

        });
    }

    getFile (url_file: string): Promise<IConnectorSourceFileResult> {
        return new Promise( (resolve, reject) => {

            const url = `${this._url_server}/v1/store/get/${url_file}`;

            axios.get(url).then( (response) => {

                const body = response.data;

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getFile for path ${url_file} return status ${body.status}`));

            }).catch( (error) => {
                if (error.response) {
                    reject(new Error(`Request to ${url_file} return code ${error.response.status}`));
                } else {
                    if (error.request) {
                        reject(error.request);
                    } else {
                        reject(error);
                    }
                }
            });
            
        });
    }

    getHashes (url_files: string[]): Promise<IConnectorSourceHashesResult[]> {
        return new Promise( (resolve, reject) => {

            const url = `${this._url_server}/v1/store/hashes`;

            axios.post(url, url_files).then( (response) => {

                const body = response.data;

                if (body.status === "success") {
                    return resolve(body.data);
                }

                return reject(new Error (`Request getHashes return status ${body.status}`));

            }).catch( (error) => {
                if (error.response) {
                    reject(new Error(`Request return code ${error.response.status}`));
                } else {
                    if (error.request) {
                        reject(error.request);
                    } else {
                        reject(error);
                    }
                }
            });

        });
    }

}