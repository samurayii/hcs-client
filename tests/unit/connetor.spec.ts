import { Logger } from "logger-flx";
import { expect } from "chai";
import { Connector, IConnectorConfig } from "../../src/lib/connector";
import { HttpSource } from "../../src/lib/connector/lib/http";

describe("Connector", function() {

    const logger = new Logger({
        mode: "debug",
        enable: true,
        type: true,
        timestamp: "time"
    });

    describe("HttpSource", function() {

        it("create", function() {

            new HttpSource("http://localhost:3001/api/", logger);

        });

        it("getList", function(done) {

            const source = new HttpSource("http://localhost:3001/api/", logger);

            source.getList("git1/app_folder").then( (files_list) => {
                
                expect(files_list).to.be.an("object");
                expect(files_list.list).to.be.an("array");

                done();

            }).catch( (error) => {
                done(error);
            });

        });

        it("getFile", function(done) {

            const source = new HttpSource("http://localhost:3001/api/", logger);

            source.getFile("git1/app2/config.toml").then( (data) => {
                
                expect(data).to.be.an("object");
                expect(data.body).to.be.an("string");

                done();

            }).catch( (error) => {
                done(error);
            });

        });

        it("getHashes", function(done) {

            const source = new HttpSource("http://localhost:3001/api/", logger);

            source.getList("git1/app_folder").then( (files_list) => {
            
                expect(files_list).to.be.an("object");
                expect(files_list.list).to.be.an("array");

                source.getHashes(files_list.list).then( (hashes_list) => {

                    expect(hashes_list).to.be.an("array");

                    done();

                }).catch( (error) => {
                    done(error);
                });

            }).catch( (error) => {
                done(error);
            });

        });

    });

    it("create", function() {

        const connector_config: IConnectorConfig = {
            url: "http://localhost:3001/api/",
            target: ["/git1/config.json:/git1/config.json"],
            interval: 5,
            update: false
        };

        new Connector(connector_config, logger);
    });



});