#!/usr/bin/env node
import * as chalk from "chalk";
import config from "./lib/entry";
import { Logger } from "logger-flx";
import { IStarterConfig, Starter } from "./lib/starter";
import { Connector, IConnectorConfig } from "./lib/connector";

const logger = new Logger({
    mode: config.logs,
    type: true,
    timestamp: "none",
    enable: true
});

const connector_config: IConnectorConfig = {
    update: config.update,
    target: config.target,
    interval: config.interval,
    url: config.url,
    tmp: config.tmp,
    keys: config.keys
};

logger.log(chalk.bold.white.bgGray("hcs-client config:"), "debug");

for (const key in config) {
    logger.log(chalk.bold.white.bgGray(`  ${key} = ${config[key]}`), "debug");
} 

const bootstrap = async () => {

    const connector = new Connector(connector_config, logger);

    await connector.run();

    if (config.exec !== undefined) {

        if (connector.heathy === false) {
            if (config.critical === true) {
                logger.error("[HCL-Client] Connector is unhealthy. Shutdown critical process.");
                process.exit(1);
            } else {
                logger.warn("[HCL-Client] Connector is unhealthy. Process not critical.");
            }
        }

        const starter_config: IStarterConfig = {
            exec: config.exec,
            cwd: config.cwd,
            restart_interval: config.restart_interval,
            webhook: config.webhook
        };

        const starter = new Starter(starter_config, logger);

        starter.run();

        connector.on("change", () => {
            starter.restart();
        });

        starter.on("close", () => {
            process.exit();
        });

        starter.on("error", () => {
            process.exit(1);
        });

        process.on("SIGTERM", () => {
            logger.log("Termination signal received");
            starter.stop();
            connector.stop();
        });

    }

};

bootstrap();