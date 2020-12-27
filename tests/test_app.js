/* eslint-disable @typescript-eslint/no-var-requires */
const http = require("http");

const app_name = "app1";
const hostname = "127.0.0.1";
const port = 6001;

//console.log(`command: ${process.argv.join(" ")}`);
//console.log(`cwd: ${process.cwd()}`);
//console.log("env:");
/*
for (const key in process.env) {
    console.log(`  ${key} = ${process.env[key]}`);
}
*/

const server = http.createServer((req, res) => {

    console.log(`received http request: ${req.url}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Hello this is ${app_name}`);

    if (req.url === "/webhook") {
        process.exit();
    }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(process.cwd());
});

process.on("SIGTERM", () => {
    console.log("Termination signal received");
    process.exit();
});

process.once("SIGKILL", (code) => {
    console.log("SIGKILL", code);
    process.exit(12);
});