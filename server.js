const http = require("http");
const url = require("url");
const fs = require("fs");
const { timeStamp } = require("console");

http
  .createServer((request, response) => {
    const addr = request.url;
    const q = new URL(addr, "http://localhost:8080");
    let filePath = "";

    if (!addr.includes("favicon")) {
      fs.appendFile(
        "log.txt",
        "URL: " + addr + "\n Timestamp: " + new Date() + "\n\n",
        (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Entry logged.");
          }
        }
      );
    }

    if (q.pathname.includes("documentation")) {
      filePath = __dirname + "/documentation.html";
      console.log("documentation");
    } else {
      filePath = "index.html";
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        throw err;
      }

      response.writeHead(200, { "Content-Type": "text/plain" });
      response.write(data);
      response.end();
    });
  })
  .listen(8080);

console.log("Local server is running on Port 8080.");
