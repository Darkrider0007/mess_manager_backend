import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import User from "../models/user.model.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.util.js";
import  fs  from "fs";

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { userName, fullName, email, password } = req.body;
  
    if (
      [userName, fullName, email, password].some(
        field => field === undefined || field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne(
        { $or: [{ userName }, { email }] }
    );

    if (existingUser) {
        fs.unlinkSync(req.file?.path)
        throw new ApiError(409, "User already exists");
    }

  
    const imageLocalPath = req.file?.path;
  
    if (!imageLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const uploadedAvatar = await uploadImageOnCloudinary(imageLocalPath);

    if (!uploadedAvatar) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const { secure_url: avatar } = uploadedAvatar;
  
    const user = await User.create({
      userName,
      fullName,
      email,
      userAvatar: avatar,
      password,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new ApiError(500, "Error while creating user");
    }
  
    res.status(201).json(new ApiResponse(201,createdUser, "User created successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

export { registerUser };
