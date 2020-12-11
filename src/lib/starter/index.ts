import * as fs from "fs";
import * as path from "path";
import { IStarter, IStarterConfig } from "./interfaces";
import { ILogger } from "logger-flx";
import { EventEmitter } from "events";
import { spawn } from "child_process";
import fetch from "node-fetch";

export * from "./interfaces";

export class Starter extends EventEmitter implements IStarter {

    private _app: ReturnType<typeof spawn>
    private readonly _full_cwd_path: string
    private _stopping_flag: boolean
    private _restarting_flag: boolean
    private _closed_flag: boolean
    private _id_interval: ReturnType<typeof setTimeout>

    constructor (
        private readonly _config: IStarterConfig,
        private readonly _logger: ILogger
    ) {

        super();

        this._full_cwd_path = path.resolve(process.cwd(), this._config.cwd);
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
        
        if (this._closed_flag === false) {
            return;
        }

        this._closed_flag = false;
        this._restarting_flag = false;

        this._logger.log("[HCL-Client] App starting ...");

        this._logger.log(`[HCL-Client] Spawn command "${this._config.exec}", workdir "${this._full_cwd_path}"`);

        this._app = spawn(this._config.exec.trim(), [], {
            cwd: this._full_cwd_path,
            env: process.env,
            stdio: ["inherit", "inherit", "inherit"],
            shell: true
        });

        this._app.on("close", (code) => {

            this._closed_flag = true;

            this._logger.log(`[HCL-Client] App closed, with code "${code}"`, "dev");

            if (this._stopping_flag === true) {
                return;
            }

            if (this._restarting_flag === false) {
                this.emit("close");
                return;
            }

            this._id_interval = setTimeout( () => {
                this.run();
            }, this._config.restart_interval * 1000);

        });

        this._app.on("error", (error) => {
            this._logger.error("[HCL-Client] Starting app error.");
            this._logger.log(error);
            this.emit("error");
        });

    }

    stop (): void {

        if (this._closed_flag === true) {
            return;
        }

        this._logger.log("[HCL-Client] Stopping app ...");

        this._closed_flag = true;
        this._stopping_flag = true;
        this._restarting_flag = false;

        clearTimeout(this._id_interval);

        this._app.kill();

    }

    restart (): void {

        if (this._restarting_flag === true || this._closed_flag === true || this._stopping_flag === true) {
            return;
        }

        this._logger.log("[HCL-Client] Restarting app ...");
        
        this._restarting_flag = true;

        clearTimeout(this._id_interval);

        if (this._config.webhook !== undefined) {

            fetch(this._config.webhook).catch( (error) => {
                this._logger.log(`[HCL-Client] Error webhook request: ${error.message}`);
            });

        } else {
            this._app.kill();
        }

    }

    get close (): boolean {

        if (this._restarting_flag === true) {
            return false;
        }

        return this._closed_flag;
    }

}