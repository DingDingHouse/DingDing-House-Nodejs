import mongoose from "mongoose";
import { Platform } from "./gameModel";

export async function addOrderToExistingGames() {
  try {
    const platforms = await Platform.find(); // Fetch all platforms

    for (const platform of platforms) {
      if (platform.games && platform.games.length > 0) {
        platform.games = platform.games.map((game, index) => {
          // Only add the order field if it doesn't exist
          if (game.order === undefined || game.order === null) {
            return {
              ...game, // Ensure game is a plain object
              order: index + 1, // Assign ascending order
            };
          }
          return game; // Keep existing order
        });

        await platform.save(); // Save only if there are updates
      }
    }

    console.log("✅ Order field added (if missing) to all games successfully!");
    // mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error updating games:", error);
    // mongoose.disconnect();
  }
}

// Run the function
