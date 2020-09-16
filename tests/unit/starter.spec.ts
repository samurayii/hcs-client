import { Logger } from "logger-flx";
//import { expect } from "chai";
import { Starter } from "../../src/lib/starter";

describe("Store", function() {

    const logger = new Logger({
        mode: "debug",
        enable: false,
        type: true,
        timestamp: "time"
    });

    it("create", function() {

        const starter_config = {
            exec: "node ../test_app.js",
            cwd: __dirname,
            restart_interval: 2
        };

        new Starter(starter_config, logger);
    });

    it("create and run", function(done) {

        this.timeout(10000);
        this.slow(15000);

        const starter_config = {
            exec: "node ../test_app.js",
            cwd: __dirname,
            restart_interval: 2
        };

        const starter = new Starter(starter_config, logger);

        starter.run();

        setTimeout( () => {
            starter.stop();
            setTimeout( () => {
                if (starter.close === true) {
                    done();
                } else {
                    done("Starter is not close");
                }
            }, 2000);
        }, 2000);

    });

    it("create and run and restart", function(done) {

        this.timeout(13000);
        this.slow(25000);

        const starter_config = {
            exec: "node ../test_app.js",
            cwd: __dirname,
            restart_interval: 2
        };

        const starter = new Starter(starter_config, logger);

        starter.run();

        setTimeout( () => {

            starter.restart();

            setTimeout( () => {
                starter.stop();
                setTimeout( () => {
                    if (starter.close === true) {
                        done();
                    } else {
                        done("Starter is not close");
                    }
                }, 2000);
            }, 4000);

        }, 2000);

    });

    it("create and run and restart (stop)", function(done) {

        this.timeout(13000);
        this.slow(25000);

        const starter_config = {
            exec: "node ../test_app.js",
            cwd: __dirname,
            restart_interval: 2
        };

        const starter = new Starter(starter_config, logger);

        starter.run();

        setTimeout( () => {

            starter.restart();
            starter.stop();

            setTimeout( () => {
                if (starter.close === true) {
                    done();
                } else {
                    done("Starter is not close");
                }
            }, 2000);

        }, 2000);

    });

});