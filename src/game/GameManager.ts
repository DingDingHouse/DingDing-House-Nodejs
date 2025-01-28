import { currentGamedata } from "../Player";
import KenoGameManager from "./KenoGames/KenoGames";
import SlotGameManager from "./slotGames/slotGame";


export default class GameManager {
   public currentGameType: SlotGameManager | KenoGameManager;
   constructor(public currentGameData: currentGamedata) {
      const currentGameType = currentGameData.gameSettings.id.substring(0, 2);
      if (currentGameType == "SL")
         this.currentGameType = new SlotGameManager(currentGameData);
      if (currentGameType == "KN")
         this.currentGameType = new KenoGameManager(currentGameData);

   }

}