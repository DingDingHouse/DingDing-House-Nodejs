import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import globalErrorHandler from "./dashboard/middleware/globalHandler";
import adminRoutes from "./dashboard/admin/adminRoutes";
import userRoutes from "./dashboard/users/userRoutes";
import transactionRoutes from "./dashboard/transactions/transactionRoutes";
import gameRoutes from "./dashboard/games/gameRoutes";
import { config } from "./config/config";
import svgCaptcha from "svg-captcha";
import createHttpError from "http-errors";
import socketController from "./socket";
import payoutRoutes from "./dashboard/payouts/payoutRoutes";
import { checkUser } from "./dashboard/middleware/checkUser";
import toggleRoutes from "./dashboard/Toggle/ToggleRoutes";
import { checkRole } from "./dashboard/middleware/checkRole";
import sessionRoutes from "./dashboard/session/sessionRoutes";
import { addOrderToExistingGames } from "./dashboard/games/script"
declare module "express-session" {
  interface Session {
    captcha?: string;
  }
}


const app = express();
//Cloudinary configs
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});



app.use(cors({
  origin: [`*.${config.hosted_url_cors}`, 'https://game-crm-rtp-backend.onrender.com'],
  credentials: true,

}));


const server = createServer(app);

// HEALTH ROUTES
app.get("/", (req, res, next) => {
  const health = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toLocaleDateString(),
  };
  res.status(200).json(health);
});

app.get("/captcha", async (req: Request, res: Response, next: NextFunction) => {
  try {
    var captcha = svgCaptcha.create();
    if (captcha) {
      req.session.captcha = captcha.text;
      res.status(200).json(captcha.data);
    } else {
      throw createHttpError(404, "Error Generating Captcha, Please refresh!");
    }
  } catch (error) {
    next(error);
  }
});

app.use("/api/company", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/payouts", checkUser, checkRole(["admin"]), payoutRoutes)
app.use("/api/toggle", checkUser, checkRole(["admin"]), toggleRoutes);
app.use("/api/session", sessionRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketController(io);
addOrderToExistingGames();


app.use(globalErrorHandler);

export default server;