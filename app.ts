import server from "./src/server";
import connectDB from "./src/config/db";
import { config } from "./src/config/config";
import { Platform } from "./src/dashboard/games/gameModel";


const startServer = async () => {

  await connectDB();

  // const patforms = await Platform.find();
  // for (const platform of patforms) {
  //   let order = 1;
  //   for (const game of platform.games) {
  //     game.order = order++;
  //   }
  //   await platform.save();
  //   console.log("Game order updated successfully");
  // }

  server.listen(config.port, () => {
    console.log("Listening on port : ", config.port);
  });
};

startServer();
