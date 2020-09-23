#!/usr/bin/env node
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
    keys: config.keys
};

const bootstrap = async () => {

    const connector = new Connector(connector_config, logger);

    await connector.run();

    if (config.exec !== undefined) {

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

        starter.on("error", (error) => {
            logger.error(error.message);
            logger.log(error.stack);
            process.exit(1);
        });

        process.on("SIGTERM", () => {
            console.log("💀 Termination signal received 💀");
            starter.stop();
            connector.stop();
        });

    }

};

bootstrap();