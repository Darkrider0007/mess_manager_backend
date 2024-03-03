import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import User from "../models/user.model.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.util.js";
import  fs  from "fs";

const options = {
  httpOnly: true,
  secure: true
};

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
  
    user.refreshToken = refreshToken;
    const saveData = await user.save({ validateBeforeSave: false });
    if (!saveData) {
      throw new ApiError(500, "Error while generating tokens");
    }
  
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}

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

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { userName, email, password } = req.body;
  
    if ((!email && !userName)|| !password) {
      throw new ApiError(400, "Username and password are required");
    }
  
    const user = await User.findOne({ $or: [{ userName }, { email }] });
  
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const isPasswordValid = await user.isPasswordCorrect(password);
  
    if (!isPasswordValid) {
      throw new ApiError(401, "Wrong password");
    }
  
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
  
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
    if (!loggedInUser) {
      throw new ApiError(500, "Error while logging in");
    }
  
    res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, {
      user: loggedInUser,
      accessToken,
      refreshToken
    }, "User logged in successfully"));
  
  } catch (error) {
    throw new ApiError(400, error.message);
    
  }
  
});


const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
    });

    res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user, "User found successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const updateUserDetails = asyncHandler(async (req, res) => {
  try {
    const { userName, fullName, email } = req.body;
    if (
      (userName === undefined && fullName === undefined && email === undefined) ||
      (userName?.trim() === "" && fullName?.trim() === "" && email?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
     {
      $set:{
        userName,
        fullName,
        email
      }
     },
     {
        new: true,
     }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(500, "Error while updating user details");
    }

    res.status(200).json(new ApiResponse(200, user, "User details updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});


export { registerUser, loginUser, logoutUser, getCurrentUser, updateUserDetails };
