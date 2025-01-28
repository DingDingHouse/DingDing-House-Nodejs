import { currentGamedata } from "../../Player";
import KenoBaseGame from "./KenoBaseGame/KenoBaseGame";

export default class KenoGameManager {
  public currentGame: any;
  constructor(public currentGameData: currentGamedata) {
    console.log(currentGameData.gameSettings.id);

    if (!currentGameData.gameSettings.isSpecial) {
      this.currentGame = new KenoBaseGame(currentGameData);
    } else {
      console.log("Special Game KNEOOOO ");
    }
  }
}
