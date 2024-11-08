import { currentGamedata } from "../../../Player";
import PlatformSession from "../../../dashboard/session/PlatformSession";
import { GameSession } from "../../../dashboard/session/gameSession";
import { sessionManager } from "../../../dashboard/session/sessionManager";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { initializeGameSettings, generateInitialReel, sendInitData, makePayLines, checkForWin } from "./helper";
import { SLSRSETTINGS } from "./types";
export class SLSR {
    public settings: SLSRSETTINGS;
    playerData = {
        haveWon: 0,
        currentWining: 0,
        totalbet: 0,
        rtpSpinCount: 0,
        totalSpin: 0,
        currentPayout: 0,
    };
    session: PlatformSession;
    gameSession: GameSession;

    constructor(public currentGameData: currentGamedata) {
        this.settings = initializeGameSettings(currentGameData, this);
        generateInitialReel(this.settings)
        sendInitData(this)
        makePayLines(this);
        this.session = sessionManager.getPlatformSession(this.getPlayerData().username);
        this.gameSession = this.session.currentGameSession;
    }

    get initSymbols() {
        const Symbols = [];
        this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
            Symbols.push(Element);
        });
        return Symbols;
    }


    sendMessage(action: string, message: any) {
        this.currentGameData.sendMessage(action, message, true);
    }

    sendError(message: string) {
        this.currentGameData.sendError(message, true);
    }

    sendAlert(message: string) {
        this.currentGameData.sendAlert(message, true);
    }

    updatePlayerBalance(amount: number) {
        this.currentGameData.updatePlayerBalance(amount);
    }

    deductPlayerBalance(amount: number) {
        this.currentGameData.deductPlayerBalance(amount);
    }

    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }

    messageHandler(response: any) {
        switch (response.id) {
            case "SPIN":
                this.prepareSpin(response.data);
                this.getRTP(response.data.spins || 1);
                break;
        }
    }
    private prepareSpin(data: any) {
        this.settings.currentLines = data.currentLines;
        this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
        this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
    }


    public async spinResult(): Promise<void> {
        try {
            const playerData = this.getPlayerData();
            if (this.settings.currentBet > playerData.credits) {
                this.sendError("Low Balance");
                return;
            }
            if (this.settings.freeSpin.freeSpinCount == 0) {
                await this.deductPlayerBalance(this.settings.currentBet);
                this.playerData.totalbet += this.settings.currentBet;
            }

            if (this.settings.freeSpin.freeSpinCount > 0) {
                this.settings.freeSpin.freeSpinCount--;
            }

            const spinId = this.gameSession.createSpin();
            this.gameSession.updateSpinField(spinId, 'betAmount', this.settings.currentBet);


            await new RandomResultGenerator(this);
            checkForWin(this);

            const winAmount = this.playerData.currentWining;
            this.gameSession.updateSpinField(spinId, 'winAmount', winAmount);

            const updateCredits = playerData.credits - this.settings.currentBet + winAmount;
            this.session.updateCredits(updateCredits);
        } catch (error) {
            this.sendError("Spin error");
            console.error("Failed to generate spin results:", error);
        }
    }

    private async getRTP(spins: number): Promise<void> {
        try {
            let spend: number = 0;
            let won: number = 0;
            this.playerData.rtpSpinCount = spins;

            for (let i = 0; i < this.playerData.rtpSpinCount; i++) {
                await this.spinResult();
                spend = this.playerData.totalbet;
                won = this.playerData.haveWon;
                console.log(`Spin ${i + 1} completed. ${this.playerData.totalbet} , ${won}`);
            }
            let rtp = 0;
            if (spend > 0) {
                rtp = won / spend;
            }
            console.log('RTP calculated:', rtp * 100);
            return;
        } catch (error) {
            console.error("Failed to calculate RTP:", error);
            this.sendError("RTP calculation error");
        }
    }

}


