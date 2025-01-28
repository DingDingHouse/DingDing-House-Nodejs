import { NextFunction, Request, Response } from "express";
import { config } from "../../config/config";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../../utils/utils";

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!config.companyApiKey) {
    return next(createHttpError(403, "Invalid API key"));
  }
  next();
}

export function extractRoleFromCookie(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const cookie = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("userToken="))
    ?.split("=")[1];
  const authHeaders = req.headers.authorization;
  const token = cookie || (authHeaders && authHeaders.startsWith("Bearer") && authHeaders.split(" ")[1]);

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET!,
      (err, decoded: DecodedToken | undefined) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            console.error("Token expired:", err.message);
            return next(createHttpError(401, "Token has expired"));
          } else {
            console.error("Token verification failed:", err.message);
            return next(createHttpError(401, "You are not authenticated"));
          }
        } else {
          req.body = {
            ...req.body,
            creatorUsername: decoded!.username,
            creatorRole: decoded!.role,
          };

          console.log(decoded!.username);
          console.log("Authenticated successfully");
          next();
        }
      }
    );
  } else {
    next(createHttpError(401, "Unauthorized: No role found in cookies"));
  }
}