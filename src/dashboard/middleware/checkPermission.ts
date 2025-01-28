import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../utils/utils";

export function checkPermission(req: Request, res: Response, next: NextFunction) {
    try {
        const _req = req as AuthRequest;
        const { username, role } = _req.user;

        const rolePermissions = {
            company: ["read", "write", "delete", "update"],
            player: ["read"]
        }

        const requiredPermission = req.route.path;

        next()

    } catch (error) {
        next(error)
    }
}