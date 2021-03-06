import { program } from "commander";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as finder from "find-package-json";
import { IAppConfig } from "./interfaces";
 
const pkg = finder(__dirname).next().value;

program.version(`version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);

program.requiredOption("-u, --url <type>", "Url to config server (Environment variable: HCS_CLIENT_URL=<type>). Example: --webhook http://config-server:5000/api");
program.option("-e, --exec <type>", "Start command application (Environment variable: HCS_CLIENT_EXEC=<type>). Example: node ./app.js");
program.option("-w, --webhook <type>", "Url to webhook application (Environment variable: HCS_CLIENT_WEBHOOK=<type>). Example: --webhook http://myapp:5000/webhook");
program.option("-i, --interval <number>", "Interval checking files/folders in seconds (Environment variable: HCS_CLIENT_INTERVAL=<number>). Example: --interval 10", "10");
program.option("-ri, --restart_interval <number>", "Restart interval app (Environment variable: HCS_CLIENT_RESTART_INTERVAL=<number>). Example: --restart_interval 2", "2");
program.option("-t, --target [letters...]", "Watching string/array of string files path (Environment variable: HCS_CLIENT_TARGET=<string[]>). Example: --target /configs/app_config.json:/configs/app_config.json");
program.option("-c, --cwd <type>", "Path to workdir (Environment variable: HCS_CLIENT_CWD=<type>). Example: --cwd /my_cwd", `${process.cwd()}`);
program.option("-tm, --tmp <type>", "Path to tmp dir (Environment variable: HCS_CLIENT_TMP=<type>). Example: --tmp /my_tmp", "tmp_hcs");
program.option("-up, --update", "Flag for watch targets update (Environment variable: HCS_CLIENT_UPDATE=(true|false)).", false);
program.option("-cr, --critical", "Flag for critical process (Environment variable: HCS_CLIENT_CRITICAL=(true|false)).", false);
program.option("-l, --logs <type>", "Logs details, can be prod, dev or debug (Environment variable: HCS_CLIENT_LOGS=<type>). Example: --logs prod", "prod");
program.option("-k, --keys [letters...]", "String/array path to keys file. (Environment variable: HCS_CLIENT_KEYS=<string[]>). Example: --keys /keys.json /keys.toml");
program.option("-s, --shell", "Flag shell mode (Environment variable: HCS_CLIENT_SHELL=(true|false)).", false);


program.parse(process.argv);

const config: IAppConfig = {
    url: program.url,
    webhook: program.webhook,
    interval: parseInt(program.interval),
    restart_interval: parseInt(program.restart_interval),
    exec: program.exec,
    target: program.target,
    cwd: program.cwd,
    update: program.update,
    shell: program.shell,
    logs: program.logs.toLowerCase(),
    keys: program.keys,
    critical: program.critical,
    tmp: program.tmp
};

if (process.env["HCS_CLIENT_WEBHOOK"] !== undefined) {
    config.webhook = process.env["HCS_CLIENT_WEBHOOK"].trim();
}
if (process.env["HCS_CLIENT_URL"] !== undefined) {
    config.url = process.env["HCS_CLIENT_URL"].trim();
}
if (process.env["HCS_CLIENT_INTERVAL"] !== undefined) {
    config.interval = parseInt(process.env["HCS_CLIENT_INTERVAL"].trim());
}
if (process.env["HCS_CLIENT_RESTART_INTERVAL"] !== undefined) {
    config.restart_interval = parseInt(process.env["HCS_CLIENT_RESTART_INTERVAL"].trim());
}
if (process.env["HCS_CLIENT_EXEC"] !== undefined) {
    config.exec = process.env["HCS_CLIENT_EXEC"].trim();
}
if (process.env["HCS_CLIENT_TARGET"] !== undefined) {
    config.target = JSON.parse(process.env["HCS_CLIENT_TARGET"].trim());
}
if (process.env["HCS_CLIENT_LOGS"] !== undefined) {
    config.logs = process.env["HCS_CLIENT_LOGS"].trim().toLowerCase();
}
if (process.env["HCS_CLIENT_KEYS"] !== undefined) {
    config.keys = JSON.parse(process.env["HCS_CLIENT_KEYS"].trim());
}

if (process.env["HCS_CLIENT_UPDATE"] !== undefined) {
    if (process.env["HCS_CLIENT_UPDATE"].trim().toLowerCase() === "true") {
        config.update = true;
    } else {
        config.update = false;
    }
}
if (process.env["HCS_CLIENT_SHELL"] !== undefined) {
    if (process.env["HCS_CLIENT_SHELL"].trim().toLowerCase() === "true") {
        config.shell = true;
    } else {
        config.shell = false;
    }
}
if (process.env["HCS_CLIENT_CWD"] !== undefined) {
    config.cwd = process.env["HCS_CLIENT_CWD"].trim();
}
if (process.env["HCS_CLIENT_TMP"] !== undefined) {
    config.tmp = process.env["HCS_CLIENT_TMP"].trim();
}
if (process.env["HCS_CLIENT_CRITICAL"] !== undefined) {
    if (process.env["HCS_CLIENT_CRITICAL"].trim().toLowerCase() === "true") {
        config.critical = true;
    } else {
        config.critical = false;
    }
}

if (config.webhook !== undefined) {
    config.webhook = config.webhook.trim();
    if (!/^http(s|)\:\/\/(.*\:.*@|)[a-z0-9]{1}[-a-z0-9.]{0,128}(\:[0-9]{1,5}|)(\/|)(.*|)$/gi.test(config.webhook)) {
        console.error(chalk.red("[ERROR] Webhook key not correspond regexp /^http(s|)\\:\\/\\/(.*\\:.*@|)[a-z0-9]{1}[-a-z0-9.]{0,128}(\\:[0-9]{1,5}|)(\\/|)(.*|)$/gi"));
        process.exit(1);
    }
}

if (config.url !== undefined) {
    config.url = config.url.trim();
    if (!/^http(s|)\:\/\/(.*\:.*@|)[a-z0-9]{1}[-a-z0-9.]{0,128}(\:[0-9]{1,5}|)(\/|)(.*|)$/gi.test(config.url)) {
        console.error(chalk.red("[ERROR] Webhook key not correspond regexp /^http(s|)\\:\\/\\/(.*\\:.*@|)[a-z0-9]{1}[-a-z0-9.]{0,128}(\\:[0-9]{1,5}|)(\\/|)(.*|)$/gi"));
        process.exit(1);
    }
}

if (config.exec !== undefined) {

    config.exec = config.exec.trim();
    config.cwd = path.resolve(process.cwd(), config.cwd.trim());
    
    if (config.exec.length <= 0) {
        console.error(chalk.red("[ERROR] Exec key is empty"));
        process.exit(1);
    }
    
    if (config.cwd.length <= 0) {
        console.error(chalk.red("[ERROR] Cwd key is empty"));
        process.exit(1);
    }
    
    if (!fs.existsSync(config.cwd)) {
        console.error(chalk.red(`[ERROR] Cwd folder ${config.cwd} not found`));
        process.exit(1);
    }

    if (config.interval <= 0) {
        console.error(chalk.red("[ERROR] Interval key must be more than 0"));
        process.exit(1);
    }

}

if (!Array.isArray(config.keys)) {
    config.keys = [];
}

if (config.logs !== "prod" && config.logs !== "dev" && config.logs !== "debug") {
    console.error(chalk.red("[ERROR] Logs must be prod, dev or debug"));
    process.exit(1);
}

if (Array.isArray(config.target)) {

    for (let item of config.target) {
        item = item.trim();
        if (!/^.*\:.*$/gi.test(item)) {
            console.error(chalk.red("[ERROR] Target item not correspond regexp /^.*\\:.*$/gi"));
            process.exit(1);
        }
    }

} else {
    config.target = [];
}

export default config;