import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import User from "../models/user.model.js";
import {
  deleteImageFromCloudinary,
  uploadImageOnCloudinary,
} from "../utils/cloudinary.util.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import Mess from "../models/mess.model.js";
import IncomingAmount from "../models/incomingAmount.model.js";
import mongoose from "mongoose";

//////////////////////////////
////// Helper Functions /////
////////////////////////////

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessTokenAndRefreshToken = async userId => {
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
};

//////////////////////////////
//// Routes Controllers /////
////////////////////////////

const registerUser = asyncHandler(async (req, res) => {
  // collect user details from the request body
  // check if all fields are provided
  // check if user already exists
  // upload user avatar to cloudinary
  // create user
  // send response

  try {
    const { userName, fullName, email, password } = req.body;

    if (
      [userName, fullName, email, password].some(
        field => field === undefined || field?.trim() === ""
      )
    ) {
      fs.unlinkSync(req.file?.path);
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });

    if (existingUser) {
      fs.unlinkSync(req.file?.path);
      throw new ApiError(409, "User already exists");
    }

    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const uploadedAvatar = await uploadImageOnCloudinary(imageLocalPath);

    if (!uploadedAvatar) {
      fs.unlinkSync(req.file?.path);
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

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Error while creating user");
    }

    res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // collect user details from the request body
  // check if all fields are provided
  // check if user exists
  // check if password is correct
  // generate access token and refresh token
  // send response
  try {
    const { userName, email, password } = req.body;

    if ((!email && !userName) || !password) {
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

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!loggedInUser) {
      throw new ApiError(500, "Error while logging in");
    }

    res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  // remove refresh token from user
  // clear cookies
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
  // get user details from the request object
  // send response
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user, "User found successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const getUserById = asyncHandler(async (req, res) => {
  // get user details from the request object
  // send response
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user, "User found successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const updateUserDetails = asyncHandler(async (req, res) => {
  // collect user details from the request body
  // check if all fields are provided
  // update user details
  // send response
  try {
    const { userName, fullName, email } = req.body;
    if (
      (userName === undefined &&
        fullName === undefined &&
        email === undefined) ||
      (userName?.trim() === "" &&
        fullName?.trim() === "" &&
        email?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          userName,
          fullName,
          email,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(500, "Error while updating user details");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user, "User details updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // collect user avatar from the request file
  // check if avatar is provided
  // upload user avatar to cloudinary
  // update user avatar
  // delete old avatar from cloudinary
  // send response
  try {
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const uploadedAvatar = await uploadImageOnCloudinary(imageLocalPath);

    if (!uploadedAvatar) {
      throw new ApiError(500, "Error while uploading avatar");
    }

    const { secure_url: avatar } = uploadedAvatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          userAvatar: avatar,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(500, "Error while updating user avatar");
    }

    await deleteImageFromCloudinary(req.user.userAvatar);

    res
      .status(200)
      .json(new ApiResponse(200, user, "User avatar updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  // collect user details from the request body
  // check if all fields are provided
  // check if old password is correct
  // update user password
  // send response
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      throw new ApiError(401, "Wrong Old password");
    }

    user.password = newPassword;
    const updatedUser = await user.save();

    if (!updatedUser) {
      throw new ApiError(500, "Error while updating password");
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "User password updated successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const newRefreshToken = asyncHandler(async (req, res) => {
  // collect refresh token from the request cookies
  // check if refresh token is provided
  // check if refresh token is valid
  // generate new access token and refresh token
  // send response
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken.id);

    if (!user) {
      throw new ApiError(
        404,
        "Token is not valid or expired, does not verify the user"
      );
    }

    if (user.refreshToken != refreshToken) {
      throw new ApiError(401, "Token is not valid or expired");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "New tokens generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

//  controller for the list of the enrolled messes

const getEnrolledMesses = asyncHandler(async (req, res) => {
  try {
    const messes = await Mess.aggregate([
      {
        $match: {
          messMembers: req.user?._id,
        },
      },
      {
        $project: {
          id: 1,
          messName: 1,
          messDescription: 1,
          messLogo: 1,
          messAdmin: 1,
          messMembers: 1,
          messMenu: 1,
        },
      },
    ]);

    if (!messes) {
      throw new ApiError(404, "Messes not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, messes, "Messes found successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const getMessesById = asyncHandler(async (req, res) => {
  try {
    console.log(req.params.id);
    const messes = await Mess.aggregate([
      {
        $match: {
          messMembers: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $project: {
          id: 1,
          messName: 1,
          messLogo: 1,
        },
      },
    ]);

    if (!messes) {
      throw new ApiError(404, "Messes not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, messes, "Messes found successfully"));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

// controller for paid amount list
const getTransactions = asyncHandler(async (req, res) => {
  try {
    const { page, limit } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };
    const transactions = await IncomingAmount.aggregate([
      {
        $match: {
          payedBy: req.user?._id,
        },
      },
      {
        $lookup: {
          from: "messes",
          localField: "messID",
          foreignField: "_id",
          as: "messID",
        },
      },
      {
        $unwind: "$messID",
      },
      {
        $project: {
          id: 1,
          payedBy: 1,
          description: 1,
          messID: {
            id: 1,
            messName: 1,
            messLogo: 1,
          },
          amount: 1,
        },
      },
    ])
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    if (!transactions) {
      throw new ApiError(404, "Transactions not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, transactions, "Transactions found successfully")
      );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserById,
  updateUserDetails,
  updateUserAvatar,
  updatePassword,
  newRefreshToken,
  getEnrolledMesses,
  getTransactions,
  getMessesById,
};
