import { StringDecoder } from "string_decoder";
import net from "net";
import _ from "underscore";

const decoder = new StringDecoder("utf8");

class DoorSocketServer {
  constructor(params) {
    this.port = params.port;
    this.clients = {};
    this.createServer();
  }

  available(group) {
    return _.find(this.clients, socketInfo => socketInfo.group === group);
  }

  createServer() {
    return net.createServer(socket => {

      // Identify this client
      socket.name = socket.remoteAddress + ":" + socket.remotePort;

      // Put this new client in the list
      this.clients[socket.name] = { socket: socket, group: "door" };
      console.log("New connection: " + socket.name);

      // Handle incoming messages from clients.
      socket.on("data", data => {
        const message = decoder.write(data);
        if (message.startsWith("G|")) {
          const group = message.substr("G|".length);
          this.clients[socket.name].group = group;
          console.log(socket.name + " now belongs to group '" + group + "'");
        } else {
          console.log("Message from " + socket.name + ": " + message);
        }
      });

      // Remove the client from the list when it leaves
      socket.on("end", () => {
        console.log("end");
        delete this.clients[socket.name];
      });

      socket.on("error", (err) => {
        console.log("Caught flash policy server socket error: ");
        console.log(err.stack);
        delete this.clients[socket.name];
      });

      socket.on("close", () => {
        console.log("Caught close.");
        delete this.clients[socket.name];
      });
    }).listen(this.port);
  }

  broadcast(group, message) {
    _.each(this.clients, socketInfo => {
      if (socketInfo.group === group) socketInfo.socket.write(message);
    });
    // Log it to the server output too
    console.log(message);
  }
}

export default DoorSocketServer;