import { NextFunction, Request, Response } from "express";
import {
  AuthRequest,
  getAllPlayerSubordinateIds,
  updateCredits,
  updatePassword,
  updateStatus,
} from "../../utils/utils";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../../config/config";
import bcrypt from "bcrypt";
import mongoose, { PipelineStage, Types } from "mongoose";
import { User, Player as PlayerModel, Player } from "./userModel";
import UserService from "./userService";
import Transaction from "../transactions/transactionModel";
import { QueryParams } from "../../utils/globalTypes";
import { IPlayer, IUser } from "./userType";
import { sessionManager } from "../session/sessionManager";
import { hasPermission, isAdmin, isSubordinate } from "../../utils/permissions";

interface ActivePlayer {
  username: string;
  currentGame: string;
}

export class UserController {
  private userService: UserService;
  private static rolesHierarchy = {
    admin: ["supermaster", "master", "distributor", "subdistributor", "store", "player"],
    supermaster: ["master", "distributor", "subdistributor", "store", "player"],
    master: ["distributor"],
    distributor: ["subdistributor"],
    subdistributor: ["store"],
    store: ["player"],
  };

  constructor() {
    this.userService = new UserService();
    this.loginUser = this.loginUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getAllSubordinates = this.getAllSubordinates.bind(this);
    this.getAllPlayers = this.getAllPlayers.bind(this);
    this.getSubordinateById = this.getSubordinateById.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.updateClient = this.updateClient.bind(this);
    this.getReport = this.getReport.bind(this);
    this.getASubordinateReport = this.getASubordinateReport.bind(this);
    this.getCurrentUserSubordinates =
      this.getCurrentUserSubordinates.bind(this);
    this.generatePassword = this.generatePassword.bind(this);
    this.logoutUser = this.logoutUser.bind(this)
  }



  private async checkUser(username: string, role: string): Promise<IUser | IPlayer | null> {
    let user: IUser | IPlayer | null = null;

    if (role === "player") {
      user = await this.userService.findPlayerByUsername(username);
    } else {
      user = await this.userService.findUserByUsername(username);
    }

    if (!user) {
      return null; // User not found
    }

    return user;
  }

  public static getSubordinateRoles(role: string): string[] {
    return this.rolesHierarchy[role] || [];
  }

  public static isRoleValid(role: string, subordinateRole: string): boolean {
    return this.getSubordinateRoles(role).includes(subordinateRole);
  }

  public static getStartAndEndOfPeriod(type: string) {
    const start = new Date();
    const end = new Date();

    switch (type) {
      case "weekly":
        start.setDate(start.getDate() - start.getDay()); // set to start of the week
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + (6 - end.getDay())); // set to end of the week
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start.setDate(1); // set to start of the month
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // set to end of the month
        end.setHours(23, 59, 59, 999);
        break;
      case "daily":
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  async generatePassword(req: Request, res: Response, next: NextFunction) {
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digitChars = "0123456789";
    const specialChars = '!@#$%^&()_/,.?":{}|<>';

    let password = "";

    password += this.userService.getRandomChar(lowercaseChars);
    password += this.userService.getRandomChar(uppercaseChars);
    password += this.userService.getRandomChar(digitChars);
    password += this.userService.getRandomChar(specialChars);

    const remainingLength = 8 - password.length;
    for (let i = 0; i < remainingLength; i++) {
      const randomSet = Math.floor(Math.random() * 3);
      if (randomSet === 0) {
        password += this.userService.getRandomChar(lowercaseChars);
      } else if (randomSet === 1) {
        password += this.userService.getRandomChar(uppercaseChars);
      } else {
        password += this.userService.getRandomChar(digitChars);
      }
    }

    password = this.userService.shuffleString(password);
    res.status(200).json({ password });
  }

  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw createHttpError(400, "Username, password are required");
      }

      let user: IUser | IPlayer = await User.findOne({ username }) || await PlayerModel.findOne({ username })


      if (!user) {
        throw createHttpError(401, "User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw createHttpError(401, "Invalid username or password");
      }

      if (user.role === "player") {
        await PlayerModel.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date(), $inc: { loginTimes: 1 } } }
        )
      }
      else {
        await User.updateOne(
          { _id: user._id },
          {
            $set: { lastLogin: new Date(), $inc: { loginTimes: 1 } }
          });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        config.jwtSecret!,
        { expiresIn: "7d" }
      );

      res.cookie("userToken", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "none",
      });


      const socketUser = sessionManager.getPlayerPlatform(username);

      if (socketUser?.platformData.socket?.connected || socketUser?.gameData.socket) {
        throw createHttpError(403, "Already logged in on another browser or tab.");
      }

      if (socketUser?.gameData.socket) {
        throw createHttpError(403, "You Are Already Playing on another browser or tab.");
      }

      res.status(200).json({
        message: "Login successful",
        token: token,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  }

  async logoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      if (!username) {
        throw createHttpError(400, "Username is required");
      }

      // Clear the user token cookie
      res.clearCookie("userToken", {
        httpOnly: true,
        sameSite: "none",
      });

      res.status(200).json({
        message: "Logout successful",
      });

    } catch (error) {
      console.log(error);
      next(error)
    }

  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const _req = req as AuthRequest;
      const { user } = req.body;
      const { username, role } = _req.user;

      if (
        !user ||
        !user.name ||
        !user.username ||
        !user.password ||
        !user.role ||
        user.credits === undefined
      ) {
        throw createHttpError(400, "All required fields must be provided");
      }
      let currentUser: IUser = await this.userService.findUserByUsername(username, session);

      if (!currentUser) {
        throw createHttpError(404, "Current User not found");
      }

      // if (!UserController.hasAccess(currentUser, user.role)) {
      //   throw createHttpError(403, `You cannot create a ${user.role}`);
      // }

      let existingUser =
        (await this.userService.findPlayerByUsername(user.username, session)) ||
        (await this.userService.findUserByUsername(user.username, session));
      if (existingUser) {
        throw createHttpError(409, "User already exists");
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      let newUser;

      if (user.role === "player") {
        newUser = await this.userService.createPlayer(
          { ...user, createdBy: currentUser._id },
          0,
          hashedPassword,
          session
        );
      } else {
        newUser = await this.userService.createUser(
          { ...user, createdBy: currentUser._id },
          0,
          hashedPassword,
          session
        );
      }

      if (user.credits > 0) {
        const transaction = await this.userService.createTransaction(
          "recharge",
          currentUser,
          newUser,
          user.credits,
          session
        );
        newUser.transactions.push(transaction._id as mongoose.Types.ObjectId);
        currentUser.transactions.push(transaction._id as mongoose.Types.ObjectId);
      }

      await newUser.save({ session });
      currentUser.subordinates.push(newUser._id);

      await currentUser.save({ session });

      await session.commitTransaction();
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    } finally {
      session.endSession();
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      let user: IUser | IPlayer = await this.checkUser(username, role);
      if (!user) {
        throw createHttpError(404, `${username} not found`);
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubordinates(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("GET ALL SUBORDINATES");
      const _req = req as AuthRequest;
      const { username: currentUsername, role: currentUserRole } = _req.user;

      const currentUser = await this.checkUser(currentUsername, currentUserRole);

      if (!currentUser) {
        throw createHttpError(404, "User not found");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const sortOrder = req.query.sort === "desc" ? -1 : 1; // Default to ascending order
      const filter = req.query.filter || "";
      const search = req.query.search as string;



      let parsedData: QueryParams = {
        role: "",
        status: "",
        totalRecharged: { From: 0, To: Infinity },
        totalRedeemed: { From: 0, To: Infinity },
        credits: { From: 0, To: Infinity },
        updatedAt: { From: null, To: null },
        type: "",
        amount: { From: 0, To: 0 },
      };

      let role, status, redeem, recharge, credits;

      if (search) {
        parsedData = JSON.parse(search);
        if (parsedData) {
          role = parsedData.role;
          status = parsedData.status;
          redeem = parsedData.totalRedeemed;
          recharge = parsedData.totalRecharged;
          credits = parsedData.credits;
        }
      }

      let query: any = {};
      if (filter) {
        query.username = { $regex: filter, $options: "i" };
      }
      if (role) {
        query.role = { $ne: currentUser.role, $eq: role };
      } else if (!role) {
        query.role = { $ne: currentUser.role };
      }
      if (status) {
        query.status = status;
      }
      if (parsedData.totalRecharged) {
        query.totalRecharged = {
          $gte: parsedData.totalRecharged.From,
          $lte: parsedData.totalRecharged.To,
        };
      }

      if (parsedData.totalRedeemed) {
        query.totalRedeemed = {
          $gte: parsedData.totalRedeemed.From,
          $lte: parsedData.totalRedeemed.To,
        };
      }

      if (parsedData.credits) {
        query.credits = {
          $gte: parsedData.credits.From,
          $lte: parsedData.credits.To,
        };
      }


      // If the user is not an admin, fetch all direct and indirect subordinates
      if (!isAdmin(currentUser)) {
        const allSubordinateIds = await this.userService.getAllSubordinateIds(currentUser._id as mongoose.Types.ObjectId);
        query._id = { $in: allSubordinateIds };
      }

      // Aggregation pipeline for User collection
      const userPipeline = [
        { $match: query },
        { $project: { _id: 1, name: 1, username: 1, status: 1, totalRedeemed: 1, totalRecharged: 1, credits: 1, createdAt: 1, role: 1 } }
      ];



      // Combined pipeline with $unionWith for PlayerModel collection
      const combinedPipeline: PipelineStage[] = [
        ...userPipeline,
        {
          $unionWith: {
            coll: "players", // Replace with the actual MongoDB collection name for PlayerModel
            pipeline: [
              { $match: query },
              { $project: { _id: 1, name: 1, username: 1, status: 1, totalRedeemed: 1, totalRecharged: 1, credits: 1, createdAt: 1, role: 1 } }
            ]
          }
        },
        { $sort: { createdAt: sortOrder } }, // Global sorting
        { $skip: skip }, // Pagination: skip to the correct page
        { $limit: limit } // Pagination: limit the number of results
      ];

      // Execute the aggregation pipeline
      const subordinates = await User.aggregate(combinedPipeline);

      // Calculate total counts
      const userCount = await User.countDocuments(query);
      const playerCount = await PlayerModel.countDocuments(query);
      const totalSubordinates = userCount + playerCount;
      const totalPages = Math.ceil(totalSubordinates / limit);


      // Response for no data
      if (totalSubordinates === 0) {
        return res.status(200).json({
          message: "No subordinates found",
          totalSubordinates: 0,
          totalPages: 0,
          currentPage: 0,
          subordinates: []
        });
      }

      // Validate requested page number
      if (page > totalPages) {
        return res.status(400).json({
          message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
          totalSubordinates,
          totalPages,
          currentPage: page,
          subordinates: []
        });
      }

      // Success response
      res.status(200).json({
        totalSubordinates,
        totalPages,
        currentPage: page,
        subordinates
      });

    } catch (error) {
      next(error);
    }
  }

  async getAllPlayers(req: Request, res: Response, next: NextFunction) {
    try {
      const activePlayers = new Set();
      sessionManager.getPlatformSessions().forEach((value, key) => {
        activePlayers.add({ username: key, currentGame: value.currentGameData.gameId });
      });

      const _req = req as AuthRequest;
      const { username: currentUsername, role: currentUserRole } = _req.user;

      const currentUser = await this.checkUser(currentUsername, currentUserRole);

      if (!currentUser) {
        throw createHttpError(404, "User not found");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const filter = req.query.filter || "";
      const search = req.query.search as string;
      let parsedData: QueryParams = {
        role: "",
        status: "",
        totalRecharged: { From: 0, To: Infinity },
        totalRedeemed: { From: 0, To: Infinity },
        credits: { From: 0, To: Infinity },
        updatedAt: { From: null, To: null },
        type: "",
        amount: { From: 0, To: 0 },
      };

      let role, status, redeem, recharge, credits;

      if (search) {
        parsedData = JSON.parse(search);
        if (parsedData) {
          role = parsedData.role;
          status = parsedData.status;
          redeem = parsedData.totalRedeemed;
          recharge = parsedData.totalRecharged;
          credits = parsedData.credits;
        }
      }

      let query: any = {
        username: { $in: Array.from(activePlayers).map((player: ActivePlayer) => player.username) },
      };

      if (filter) {
        query.username.$regex = filter;
        query.username.$options = "i";
      }
      if (role) {
        query.role = role;
      }
      if (status) {
        query.status = status;
      }
      if (parsedData.totalRecharged) {
        query.totalRecharged = {
          $gte: parsedData.totalRecharged.From,
          $lte: parsedData.totalRecharged.To,
        };
      }

      if (parsedData.totalRedeemed) {
        query.totalRedeemed = {
          $gte: parsedData.totalRedeemed.From,
          $lte: parsedData.totalRedeemed.To,
        };
      }

      if (parsedData.credits) {
        query.credits = {
          $gte: parsedData.credits.From,
          $lte: parsedData.credits.To,
        };
      }

      // If the user is not an admin, fetch all direct and indirect players
      if (!isAdmin(currentUser)) {
        const allPlayerSubordinateIds = await getAllPlayerSubordinateIds(currentUser._id as mongoose.Types.ObjectId, currentUser.role);
        query.createdBy = { $in: allPlayerSubordinateIds };
      }

      const playerCount = await PlayerModel.countDocuments(query);
      const totalPages = Math.ceil(playerCount / limit);

      if (playerCount === 0) {
        return res.status(200).json({
          message: "No players found",
          totalSubordinates: 0,
          totalPages: 0,
          currentPage: 0,
          subordinates: [],
        });
      }

      if (page > totalPages) {
        return res.status(400).json({
          message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
          totalSubordinates: playerCount,
          totalPages,
          currentPage: page,
          subordinates: [],
        });
      }

      const players = await PlayerModel.find(query).skip(skip).limit(limit);

      const playersWithGameInfo = players.map(player => {
        const activePlayer = Array.from(activePlayers).find((ap: ActivePlayer) => ap.username === player.username) as ActivePlayer | undefined;

        return {
          ...player.toObject(),
          currentGame: activePlayer?.currentGame || 'inactive',
        };
      });

      res.status(200).json({
        totalSubordinates: playerCount,
        totalPages,
        currentPage: page,
        subordinates: playersWithGameInfo,
      });
    } catch (error) {
      next(error);
    }
  }


  async getCurrentUserSubordinates(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { id } = req.query;

      const currentUser = await this.checkUser(username, role);
      if (!currentUser) {
        throw createHttpError(401, "User not found");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const sortOrder = req.query.sort === "desc" ? -1 : 1; // Default to ascending


      let userToCheck = currentUser;


      if (id) {
        userToCheck = await User.findById(id) || await PlayerModel.findById(id);

        if (!userToCheck) {
          return res.status(404).json({ message: "User not found" });
        }

      }

      let filterRole, status, redeem, recharge, credits;
      const filter = req.query.filter || "";
      const search = req.query.search as string;
      let parsedData: QueryParams = {
        role: "",
        status: "",
        totalRecharged: { From: 0, To: Infinity },
        totalRedeemed: { From: 0, To: Infinity },
        credits: { From: 0, To: Infinity },
        updatedAt: { From: new Date(), To: new Date() },
        type: "",
        amount: { From: 0, To: 0 },
      };

      if (search) {
        parsedData = JSON.parse(search);
        if (parsedData) {
          filterRole = parsedData.role;
          status = parsedData.status;
          redeem = parsedData.totalRedeemed;
          recharge = parsedData.totalRecharged;
          credits = parsedData.credits;
        }
      }

      let query: any = {};
      query.createdBy = userToCheck._id;
      if (filter) {
        query.username = { $regex: filter, $options: "i" };
      }
      if (filterRole) {
        query.role = { $ne: currentUser.role, $eq: filterRole };
      } else if (!filterRole) {
        query.role = { $ne: currentUser.role };
      }
      if (status) {
        query.status = status;
      }
      if (parsedData.totalRecharged) {
        query.totalRecharged = {
          $gte: parsedData.totalRecharged.From,
          $lte: parsedData.totalRecharged.To,
        };
      }

      if (parsedData.totalRedeemed) {
        query.totalRedeemed = {
          $gte: parsedData.totalRedeemed.From,
          $lte: parsedData.totalRedeemed.To,
        };
      }

      if (parsedData.credits) {
        query.credits = {
          $gte: parsedData.credits.From,
          $lte: parsedData.credits.To,
        };
      }

      // Aggregation pipeline
      const userPipeline: PipelineStage[] = [
        { $match: query },
        { $project: { _id: 1, name: 1, username: 1, status: 1, totalRedeemed: 1, totalRecharged: 1, credits: 1, createdAt: 1, role: 1 } }
      ];

      const combinedPipeline: PipelineStage[] = [
        ...userPipeline,
        {
          $unionWith: {
            coll: "players", // Replace with the actual collection name for PlayerModel
            pipeline: [
              { $match: query },
              { $project: { _id: 1, name: 1, username: 1, status: 1, totalRedeemed: 1, totalRecharged: 1, credits: 1, createdAt: 1, role: 1 } }
            ]
          }
        },
        { $sort: { "createdAt": sortOrder } }, // Global sorting
        { $skip: skip }, // Pagination
        { $limit: limit } // Pagination
      ];

      // Execute the aggregation
      const subordinates = await User.aggregate(combinedPipeline);


      // Total counts
      const userCount = await User.countDocuments(query);
      const playerCount = await PlayerModel.countDocuments(query);
      const totalSubordinates = userCount + playerCount;
      const totalPages = Math.ceil(totalSubordinates / limit);

      // Handle no results
      if (totalSubordinates === 0) {
        return res.status(200).json({
          message: "No subordinates found",
          totalSubordinates: 0,
          totalPages: 0,
          currentPage: 0,
          subordinates: [],
        });
      }

      // Handle out-of-range page
      if (page > totalPages) {
        return res.status(400).json({
          message: `Page number ${page} is out of range. There are only ${totalPages} pages available.`,
          totalSubordinates,
          totalPages,
          currentPage: page,
          subordinates: [],
        });
      }


      // Return response
      res.status(200).json({
        totalSubordinates,
        totalPages,
        currentPage: page,
        subordinates,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {

      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { clientId } = req.params;

      if (!clientId) {
        throw createHttpError(400, "Client Id is required");
      }

      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      let admin: IUser = await this.userService.findUserByUsername(username);

      if (!admin) {
        throw createHttpError(404, "User Not Found");
      }

      const client =
        (await this.userService.findUserById(clientObjectId)) ||
        (await this.userService.findPlayerById(clientObjectId));

      if (!client) {
        throw createHttpError(404, "User not found");
      }

      if (!hasPermission(admin, `${client.role}s`, 'x')) {
        throw createHttpError(403, `Access denied. You don't have permission to delete ${client.username}.`);
      }


      if (client instanceof User) {
        await this.userService.deleteUserById(clientObjectId);
      } else if (client instanceof Player) {
        await this.userService.deletePlayerById(clientObjectId);
      }

      admin.subordinates = admin.subordinates.filter(
        (id) => !id.equals(clientObjectId)
      );

      await admin.save();
      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { clientId } = req.params;
      const { status, credits, password } = req.body;

      if (!clientId) {
        throw createHttpError(400, "Client Id is required");
      }

      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      let admin: IUser | IPlayer = await this.userService.findUserByUsername(username) || await this.userService.findPlayerByUsername(username);

      if (!admin) {
        throw createHttpError(404, "User not found");
      }

      const client = await this.userService.findUserById(clientObjectId) || await this.userService.findPlayerById(clientObjectId);

      if (!client) {
        throw createHttpError(404, "Client not found");
      }

      if (!hasPermission(admin, `${client.role}s`, "w")) {
        throw createHttpError(403, "Access denied. You don't have permission to update users.");
      }


      if (status) {
        updateStatus(client, status);
      }

      if (password) {
        await updatePassword(client, password);
      }

      if (credits) {
        credits.amount = Number(credits.amount);
        await updateCredits(client, admin, credits);
      }

      await admin.save();
      await client.save();

      res.status(200).json({ message: "Client updated successfully", client });
    } catch (error) {
      console.log("Error in updating : ", error);
      next(error);
    }
  }

  async getSubordinateById(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { subordinateId } = req.params;
      const { username: loggedUserName, role: loggedUserRole } = _req.user;

      const subordinateObjectId = new mongoose.Types.ObjectId(subordinateId);
      const loggedUser = await this.userService.findUserByUsername(loggedUserName);

      let user;

      user = await this.userService.findUserById(subordinateObjectId) || await this.userService.findPlayerById(subordinateObjectId);

      if (!user) {
        throw createHttpError(404, "User not found");
      }

      if (
        loggedUserRole === "admin" ||
        loggedUser.subordinates.includes(subordinateObjectId) ||
        user._id.toString() == loggedUser._id.toString()
      ) {
        let client;

        switch (user.role) {
          case "admin":
            client = await User.findById(subordinateId).populate({
              path: "transactions",
              model: Transaction,
            });
            const userSubordinates = await User.find({
              createdBy: subordinateId,
            });

            const playerSubordinates = await PlayerModel.find({
              createdBy: subordinateId,
            });

            client = client.toObject();
            client.subordinates = [...userSubordinates, ...playerSubordinates];

            break;

          case "store":
            client = await User.findById(subordinateId)
              .populate({ path: "subordinates", model: PlayerModel })
              .populate({ path: "transactions", model: Transaction });
            break;

          case "player":
            client = user;
            break;

          default:
            client = await User.findById(subordinateObjectId)
              .populate({ path: "transactions", model: Transaction })
              .populate({ path: "subordinates", model: User });
        }

        if (!client) {
          throw createHttpError(404, "Client not found");
        }

        res.status(200).json(client);
      } else {
        throw createHttpError(
          403,
          "Forbidden: You do not have the necessary permissions to access this resource."
        );
      }
    } catch (error) {
      next(error);
    }
  }

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("GET REPORT");

      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { type, userId } = req.query;
      const { start, end } = UserController.getStartAndEndOfPeriod(
        type as string
      );

      const currentUser = await User.findOne({ username });

      if (!currentUser) {
        throw createHttpError(401, "User not found");
      }

      let targetUser = currentUser;

      if (userId) {
        let subordinate = await User.findById(userId);

        if (!subordinate) {
          subordinate = await PlayerModel.findById(userId);

          if (!subordinate) {
            throw createHttpError(404, "Subordinate user not found");
          }
        }

        targetUser = subordinate;
      }


      if (targetUser.role === "admin" || targetUser.role === "supermaster") {
        const subordinateIds = await targetUser.role === "supermaster" ? await this.userService.getAllSubordinateIds(targetUser._id as mongoose.Types.ObjectId) : [];

        // For admin/supermaster - get all subordinate transactions
        const totalRechargedAmt = await Transaction.aggregate([
          {
            $match: {
              $and: [
                { createdAt: { $gte: start, $lte: end } },
                { type: "recharge" },
                ...(targetUser.role === "supermaster" ? [{
                  $or: [
                    { creditor: targetUser.username }, // Credits given by supermaster
                    { debtor: targetUser.username },   // Credits received by supermaster
                    { creditor: { $in: subordinateIds.map(id => id.toString()) } }, // Credits given by subordinates
                    { debtor: { $in: subordinateIds.map(id => id.toString()) } }    // Credits received by subordinates
                  ]
                }] : []) // For admin, no additional filters to get all transactions
              ]
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" }
            }
          }
        ]);


        // Total Redeem Amount
        const totalRedeemedAmt = await Transaction.aggregate([
          {
            $match: {
              $and: [
                { createdAt: { $gte: start, $lte: end } },
                { type: "redeem" },
                ...(targetUser.role === "supermaster" ? [{
                  $or: [
                    { creditor: targetUser.username },    // Redeem received by supermaster
                    { debtor: targetUser.username },      // Redeem given by supermaster
                    { creditor: { $in: subordinateIds.map(id => id.toString()) } }, // Redeem received by subordinates
                    { debtor: { $in: subordinateIds.map(id => id.toString()) } }    // Redeem given by subordinates
                  ]
                }] : [])
              ]
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" }
            }
          }
        ]);
        const userMatch = targetUser.role === "supermaster" ?
          {
            $and: [
              { role: { $ne: "admin" } },
              { createdAt: { $gte: start, $lte: end } },
              { createdBy: targetUser._id }, // Only direct subordinates
              { _id: { $in: subordinateIds } } // Only users in the hierarchy chain
            ]
          } :
          {
            $and: [
              { role: { $ne: "admin" } },
              { createdAt: { $gte: start, $lte: end } }
            ]
          };

        const users = await User.aggregate([
          { $match: userMatch },
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 }
            }
          }
        ]);


        const playerMatch = targetUser.role === "supermaster" ?
          {
            role: "player",
            createdAt: { $gte: start, $lte: end },
            createdBy: { $in: subordinateIds }
          } :
          {
            role: "player",
            createdAt: { $gte: start, $lte: end }
          };

        const players = await PlayerModel.countDocuments(playerMatch);

        const counts = users.reduce((acc: Record<string, number>, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        counts["player"] = players;

        const transactionMatch = targetUser.role === "supermaster" ?
          {
            createdAt: { $gte: start, $lte: end },
            $or: [
              { creditor: targetUser.username },
              { debtor: targetUser.username },
              { "creditorDetails.createdBy": { $in: subordinateIds } },
              { "debtorDetails.createdBy": { $in: subordinateIds } }
            ]
          } :
          { createdAt: { $gte: start, $lte: end } };

        const transactions = await Transaction.find(transactionMatch)
          .sort({ createdAt: -1 })
          .limit(9);

        return res.status(200).json({
          username: targetUser.username,
          credits: targetUser.credits,
          role: targetUser.role,
          recharge: totalRechargedAmt[0]?.totalAmount || 0,
          redeem: totalRedeemedAmt[0]?.totalAmount || 0,
          users: counts,
          transactions
        });
      } else {
        const [userRechargeAmt, userRedeemAmt, userTransactions, users] = await Promise.all([
          Transaction.aggregate([
            {
              $match: {
                $and: [
                  { createdAt: { $gte: start, $lte: end } },
                  { type: "recharge" },
                  { creditor: targetUser.username }  // Changed from debtor to creditor
                ]
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
              }
            }
          ]),
          Transaction.aggregate([
            {
              $match: {
                $and: [
                  { createdAt: { $gte: start, $lte: end } },
                  { type: "redeem" },
                  { debtor: targetUser.username }
                ]
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
              }
            }
          ]),
          Transaction.find({
            $or: [
              { debtor: targetUser.username },
              { creditor: targetUser.username }
            ],
            createdAt: { $gte: start, $lte: end }
          }).sort({ createdAt: -1 }),
          (targetUser.role === "store" || targetUser.role === "player") ?
            PlayerModel.aggregate([
              {
                $match: {
                  $and: [
                    { createdBy: targetUser._id },
                    { createdAt: { $gte: start, $lte: end } }
                  ]
                }
              },
              {
                $group: {
                  _id: "$role",
                  count: { $sum: 1 }
                }
              }
            ]) :
            User.aggregate([
              {
                $match: {
                  $and: [
                    { createdBy: targetUser._id },
                    { createdAt: { $gte: start, $lte: end } }
                  ]
                }
              },
              {
                $group: {
                  _id: "$role",
                  count: { $sum: 1 }
                }
              }
            ])
        ]);

        console.log("USER TRANSACTIONS", userTransactions);

        console.log('Debug recharge transactions:', await Transaction.find({
          type: "recharge",
          debtor: targetUser.username,
          createdAt: { $gte: start, $lte: end }
        }));

        const counts = users.reduce((acc: Record<string, number>, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        return res.status(200).json({
          username: targetUser.username,
          credits: targetUser.credits,
          role: targetUser.role,
          recharge: userRechargeAmt[0]?.totalAmount || 0,
          redeem: userRedeemAmt[0]?.totalAmount || 0,
          users: counts,
          transactions: userTransactions
        });

      }
    } catch (error) {
      next(error);
    }
  }

  async getASubordinateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username: loggedUsername, role: loggedUserRole } = _req.user;
      const { subordinateId } = req.params;
      const { type } = req.query;
      const { start, end } = UserController.getStartAndEndOfPeriod(
        type as string
      );


      const subordinateObjectId = new mongoose.Types.ObjectId(subordinateId);

      // Fetch subordinate details
      let subordinate = await User.findById(subordinateObjectId) || await PlayerModel.findById(subordinateObjectId);

      if (!subordinate) {
        throw createHttpError(404, "Subordinate not found");
      }


      // Fetch transactions where the subordinate is either the creditor or the debtor
      const transactions = await Transaction.find({
        $or: [
          { creditor: subordinate.username },
          { debtor: subordinate.username }
        ],
        createdAt: { $gte: start, $lte: end }
      });

      // Aggregate the total credits given and money spent today
      const totalCreditsGivenToday = transactions
        .filter(t => t.creditor === subordinate.username)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalMoneySpentToday = transactions
        .filter(t => t.debtor === subordinate.username)
        .reduce((sum, t) => sum + t.amount, 0);



      // Fetch users and players created by this subordinate today
      const [usersCreatedToday, playersCreatedToday] = await Promise.all([
        User.find({ createdBy: subordinate._id, createdAt: { $gte: start, $lte: end } }),
        PlayerModel.find({ createdBy: subordinate._id, createdAt: { $gte: start, $lte: end } })
      ]);

      const report = {
        creditsGiven: totalCreditsGivenToday,
        moneySpent: totalMoneySpentToday,
        transactions,
        users: usersCreatedToday,
        players: playersCreatedToday,
      };

      res.status(200).json(report);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
}