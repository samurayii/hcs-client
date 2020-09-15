import * as fs from "fs";
import * as path from "path";
import { IStarter } from "./interfaces";
import { ILogger } from "logger-flx";
import { EventEmitter } from "events";
import { spawn } from "child_process";

export * from "./interfaces";

export class Starter extends EventEmitter implements IStarter {

    private _app: ReturnType<typeof spawn>
    private readonly _full_cwd_path: string
    private _stopping_flag: boolean
    private _restarting_flag: boolean
    private _closed_flag: boolean

    constructor (
        private readonly _exec: string,
        private readonly _cwd: string,
        private readonly _logger: ILogger
    ) {

        super();

        this._full_cwd_path = path.resolve(process.cwd(), this._cwd);
        this._stopping_flag = false;
        this._restarting_flag = false;
        this._closed_flag = true;

        if (!fs.existsSync(this._full_cwd_path)) {
            fs.mkdirSync(this._full_cwd_path, {
                recursive: true
            });
        }

    }

    run (): void {
        console.log("run");
    }

    stop (): void {

        if (this._closed_flag === true) {
            return;
        }

        this._logger.log("Stopping app ...");

        this._closed_flag = true;
        this._stopping_flag = true;
        this._restarting_flag = false;

        this._app.kill();

    }

    restart (): void {
        console.log("restart");
    }

    get close (): boolean {
        if (this._restarting_flag === true) {
            return false;
        }

        return this._closed_flag;
    }

}