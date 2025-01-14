import server from "./src/server";
import connectDB from "./src/config/db";
import { config } from "./src/config/config";
import { User } from "./src/dashboard/users/userModel";
const startServer = async () => {

  await connectDB();
  server.listen(config.port, () => {
    console.log("Listening on port : ", config.port);
  });
};

startServer();
