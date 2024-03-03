import { asyncHandler } from "../utils/asyncHandler.util";
import jwt from "jsonwebtoken";
import User  from "../models/user.model";


const verifyJWT = asyncHandler(async (req, res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded.id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;

        next();        
    } catch (error) {
        throw new ApiError(500, error.message);
    }
    });