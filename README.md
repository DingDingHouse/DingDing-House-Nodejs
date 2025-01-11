# Slot Machine Game Backend

## Overview

This project is a backend implementation for a slot machine game. The
backend is built using Node.js and Express.js and includes the following
main components:

- `user.ts`: Entry point where a player joins the game.

- `global.ts`: Initializes and stores data fetched from a mock API.

- `slotDataInit.ts`: Creates and initializes slot data.

- `slotResults.ts`: Processes the results of the slot machine game.

## Installation

1. Clone the repository:

```
git clone https://github.com/your-repo/slot-machine-backend.git
```

2. Navigate to the project directory:

cd slot-machine-backend

```

3. Install dependencies:

```

npm install

```

4. Start the development server:

```

npm run dev

```

## Usage

To run the backend server, use the following command:

```

npm start

## Project Structure

### user.ts

The entry point of the application. This file handles the player joining
the game and initiates the game flow.

#### Key Functions:

- `joinGame`: Handles the logic when a player joins the game.
- Initializes the player's session.
- Calls the `initializeGameData` function in `global.ts` to fetch
  and store game data.

### global.ts

This file is responsible for initializing and storing data fetched from
a mock API. It also creates a matrix that represents the game's initial
state.

#### Key Functions:

- `fetchData`: Fetches data from a mock API.

```typescript
async function fetchData() {
  const response = await fetch("https://mockapi.io/data");
  const data = await response.json();
  return data;
}
```

- `initializeGameData`: Stores the fetched data and initializes the
  game matrix.

```typescript
async function initializeGameData() {
  const data = await fetchData();
  gameSettings.data = data;
  createMatrix();
}
```

### slotDataInit.ts

Handles the creation and initialization of slot data. This includes
setting up the pay lines and symbols for the slot machine.

#### Key Functions:

- `GameDataInit`: Adds all the Game Data from the Database and makes the full paytable .

```typescript
function gameDataInit() {
  makeFullPayTable();
}
```

- `addPayLineSymbols`: Adds symbols to pay lines.

```typescript
function addPayLineSymbols(symbol, repetition, pay, freeSpins) {
  const line = Array(repetition).fill(symbol);
  if (line.length !== gameSettings.matrix.x) {
    let lengthToAdd = gameSettings.matrix.x - line.length;
    for (let i = 0; i < lengthToAdd; i++) line.pu("any");
  }
  gameSettings.payLine.pu({ line, pay, freeSpins });
}
```

- `makePayLines`: Creates pay lines based on the game settings.

```typescript
function makePayLines() {
  gameSettings.currentGamedata.Symbols.forEach((element) => {
    if (element.useWildSub || element.multiplier?.length > 0) {
      element.multiplier?.forEach((item, index) => {
        addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
      });
    } else {
      handleSpecialSymbols(element);
    }
  });
}
```

- `handleSpecialSymbols`: Processes special symbols like wild,
  scatter, and bonus.

```typescript
function handleSpecialSymbols(symbol) {
  switch (symbol.Name) {
    case specialIcons.jackpot:
      // Handle jackpot symbol
      break;
    case specialIcons.wild:
      // Handle wild symbol
      break;
    case specialIcons.scatter:
      // Handle scatter symbol
      break;
    case specialIcons.bonus:
      // Handle bonus symbol
      break;
    default:
      break;
  }
}
```

- `randomWeightedIndex`: it helps in creating the matrix for the inital Reel and the Result Reel.

```typescript
// Function to generate a random number based on weights
  randomWeightedIndex(weights: number[]): number {
    // Default to last index if not found
    return weights.length - 1;
  }
```

### slotResults.ts

Processes the results of the slot machine game. It handles win
calculations, bonus rounds, and updating the game state.

#### Key Functions:

- `CheckForWin`: Check For win in the results of a spin.

```typescript
function calculateResults() {
  // Logic to calculate results
  console.log("Calculating results...");
}
```

- `calculateResults`: Calculates the results of a spin.

```typescript
function calculateResults() {
  // Logic to calculate results
  console.log("Calculating results...");
}
```

- `checkForBonus`: Checks and initiates bonus rounds.

```typescript
function checkForBonus() {
  if (!gameSettings.currentGamedata.bonus.isEnabled) return;
  // Logic to check and initiate bonus
  console.log("Checking for bonus...");
}
```

- `updateBalance`: Updates the player's balance based on the
  results.

```typescript
function updateBalance() {
  // Logic to update balance
  console.log("Updating balance...");
}
```

## Flow

1. **User Joins the Game** (`user.ts`):

- The player joins the game, which triggers the `joinGame` function.
- This function initializes the player session and calls
  `initializeGameData` in `global.ts`.

2. **Initialize Game Data** (`global.ts`):

- The `fetchData` function fetches data from a mock API.
- The `initializeGameData` function stores the fetched data and sets
  up the initial game matrix.

3. **Initialize Slot Data** (`slotDataInit.ts`):

- The `makePayLines` function sets up the pay lines for the slot
  machine.
- Special symbols are handled by `handleSpecialSymbols`.

4. **Calculate Slot Results** (`slotResults.ts`):

- The `calculateResults` function processes the results of a spin.
- It checks for bonus rounds using `checkForBonus` and updates the
  player's balance with `updateBalance`.

## API Endpoints

### Join Game

**Endpoint:** `POST /api/join`
**Description:** This endpoint is used for a player to join the
game.
**Request:**

```json
{
  "playerId": "string"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Player joined successfully."
}
```

### Fetch Game Data

**Endpoint:** `GET /api/gameData`
**Description:** Fetches the current game data.
**Response:**

```json
{
  "status": "success",
  "data": {
    // game data
  }
}
```

### Spin

**Endpoint:** `POST /api/spin`
**Description:** Initiates a spin on the slot machine.
**Request:**

```json
{
  "betAmount": "number"
}
```

**Response:**

```json
{
  "status": "success",
  "result": {
    // spin result data
  }
}
```

### Fetch Results

**Endpoint:** `GET /api/results`
**Description:** Fetches the results of the latest spin.
**Response:**

```json
{
  "status": "success",
  "data": {
    // result data
  }
}
```

## Detailed Functions

### joinGame

Handles the logic when a player joins the game.

```typescript
async function joinGame(playerId: string) {
  // Initialize player session
  const player = await getPlayerData(playerId);
  if (!player) {
    throw new Error("Player not found");
  }
  // Initialize game data
  await initializeGameData();
  return {
    status: "success",
    message: "Player joined successfully.",
  };
}
```

### fetchData

Fetches data from a mock API.

```typescript
async function fetchData() {
  const response = await fetch("https://mockapi.io/data");
  const data = await response.json();
  return data;
}
```

### initializeGameData

Stores the fetched data and initializes the game matrix.

```typescript
async function initializeGameData() {
  const data = await fetchData();
  gameSettings.data = data;
  createMatrix();
}
```

### addPayLineSymbols

Adds symbols to pay lines.

```typescript
function addPayLineSymbols(symbol, repetition, pay, freeSpins) {
  const line = Array(repetition).fill(symbol);
  if (line.length !== gameSettings.matrix.x) {
    let lengthToAdd = gameSettings.matrix.x - line.length;
    for (let i = 0; i < lengthToAdd; i++) line.pu("any");
  }
  gameSettings.payLine.pu({ line, pay, freeSpins });
}
```

### makePayLines

Creates pay lines based on the game settings.

```typescript
function makePayLines() {
  gameSettings.currentGamedata.Symbols.forEach((element) => {
    if (element.useWildSub || element.multiplier?.length > 0) {
      element.multiplier?.forEach((item, index) => {
        addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
      });
    } else {
      handleSpecialSymbols(element);
    }
  });
}
```

### handleSpecialSymbols

Processes special symbols like wild, scatter, and bonus.

```typescript
function handleSpecialSymbols(symbol) {
  switch (symbol.Name) {
    case specialIcons.jackpot:
      // Handle jackpot symbol
      break;
    case specialIcons.wild:
      // Handle wild symbol
      break;
    case specialIcons.scatter:
      // Handle scatter symbol
      break;
    case specialIcons.bonus:
      // Handle bonus symbol
      break;
    default:
      break;
  }
}
```

### CheckForWins

Checks for Win in the results of a spin.

```typescript
function checkForWin() {
  // Logic to calculate results
  console.log("Checks for Winns...");
}
```

### calculateResults

Calculates the results of a spin.

```typescript
function calculateResults() {
  // Logic to calculate results
  console.log("Calculating results...");
}
```

### checkForBonus

Checks and initiates bonus rounds.

```typescript
function checkForBonus() {
  if (!gameSettings.currentGamedata.bonus.isEnabled) return;
  // Logic to check and initiate bonus
  console.log("Checking for bonus...");
}
```

### updateBalance

Updates the player's balance based on the results.

```typescript
function updateBalance() {
  // Logic to update balance
  console.log("Updating balance...");
}
```

## Conclusion

This backend implementation provides a robust structure for a slot
machine game. It handles player sessions, game data initialization, slot
data setup, and result processing efficiently. Feel free to explore and
extend the functionalities as needed.
For any questions or contributions, please refer to the
[Contributing](CONTRIBUTING.md) guidelines.
