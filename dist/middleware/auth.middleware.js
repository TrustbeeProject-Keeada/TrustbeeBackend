import jwt from "jsonwebtoken";
import { AppError } from "../utils/app.error.js";
export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        // 2. Vi använder return next() istället för throw i en asynkron funktion!
        return next(new AppError("Unauthorized", 401));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const payload = decoded;
        req.user = { id: payload.id, role: payload.role };
        next();
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({
                message: "Forbidden, you do not have the required permissions",
            });
        }
        next();
    };
};
