import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
interface DecodedToken {
  username: string;
  role?: string;
}

export const verifyPlayerToken = (socket: Socket): Promise<DecodedToken> => {
  return new Promise((resolve, reject) => {
    const token = socket.handshake.auth.token;
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET!,
        (err: any, decoded: DecodedToken | undefined) => {
          if (err) {
            console.error("Token verification failed:", err.message);
            reject(new Error("You are not authenticated"));
          } else {
            resolve(decoded!);
          }
        }
      );
    } else {
      reject(new Error("No authentication token provided"));
    }
  });
};
