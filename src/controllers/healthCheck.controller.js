import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import fs from "fs";

const healthCheckControllerGet = (req, res) => {
  res.status(200).send("Server is up and running");
};

const healthCheckControllerPost = (req, res) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Please upload an image");
  }
  const test = "test";
  res
    .status(200)
    .cookie("healthCheck", test, {
      httpOnly: true,
      secure: true,
    })
    .json(
      new ApiResponse(
        200,
        file.originalname,
        "Health check image uploaded successfully"
      )
    );
};

const healthCheckControllerDelete = asyncHandler(async (req, res) => {
  try {
    const files = fs.readdir("./public/images", (err, files) => {
      if (err) {
        throw new ApiError(500, "Error deleting health check images", err);
      }
      files.map(file => fs.unlinkSync(`./public/images/${file}`));
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Health check images deleted successfully"));
  } catch (err) {
    throw new ApiError(500, "Error deleting health check images", err);
  }
});

export {
  healthCheckControllerGet,
  healthCheckControllerPost,
  healthCheckControllerDelete,
};
