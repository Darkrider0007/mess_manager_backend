import Expanse from "../models/expanse.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import Mess from "../models/mess.model.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import mongoose from "mongoose";

const addExpanse = asyncHandler(async (req, res) => {
  try {
    const messID = req.params?.messID;
    const { expanseFor, description, amount } = req.body;

    if (
      expanseFor?.trim() == "" &&
      description?.trim() == "" &&
      amount == NaN
    ) {
      throw new ApiError(
        400,
        "Expanse For or Description or Amount is required"
      );
    }

    const mess = await Mess.findById(messID);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    const expanse = await Expanse.create({
      expanseFor,
      description,
      messID,
      amount,
    });

    mess.totalMoney = parseFloat(mess.totalMoney) - parseFloat(amount);
    await mess.save();

    res
      .status(201)
      .json(new ApiResponse(201, expanse, "Expanse added successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const updateExpanse = asyncHandler(async (req, res) => {
  try {
    const expanseID = req.params?.expanseID;
    const { expanseFor, description, amount } = req.body;
    if (
      expanseFor?.trim() == "" &&
      description?.trim() == "" &&
      amount?.trim() == ""
    ) {
      throw new ApiError(
        400,
        "Expanse For or Description or Amount is required"
      );
    }

    const expanse = await Expanse.findById(expanseID);
    if (!expanse) {
      throw new ApiError(404, "Expanse not found");
    }

    if (
      expanse.amount == amount &&
      expanse.expanseFor == expanseFor &&
      expanse.description == description
    ) {
      throw new ApiError(400, "No changes found");
    }

    const mess = await Mess.findById(expanse.messID);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess?.messAdmin.toString() !== req.user?._id.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to update incoming money"
      );
    }

    mess.totalMoney =
      parseFloat(mess.totalMoney) +
      parseFloat(expanse.amount) -
      parseFloat(amount);

    if (expanseFor !== "" && expanse.expanseFor !== expanseFor) {
      expanse.expanseFor = expanseFor;
    }

    if (description !== "" && expanse.description !== description) {
      expanse.description = description;
    }

    if (amount !== "" && expanse.amount !== amount) {
      expanse.amount = amount;
    }

    await expanse.save();
    await mess.save();

    res
      .status(200)
      .json(new ApiResponse(200, expanse, "Expanse updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getExpanse = asyncHandler(async (req, res) => {
  try {
    const messID = req.params?.messID;
    const { page, limit } = req.query;

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    const expanses = await Expanse.aggregate([
      {
        $match: {
          messID: new mongoose.Types.ObjectId(messID),
        },
      },
      {
        $lookup: {
          from: "messes",
          localField: "messID",
          foreignField: "_id",
          as: "mess",
        },
      },
      {
        $unwind: "$mess",
      },
      {
        $project: {
          expanseFor: 1,
          description: 1,
          amount: 1,
          messName: "$mess.messName",
          messLogo: "$mess.messLogo",
          messID: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    res
      .status(200)
      .json(new ApiResponse(200, expanses, "Expanse fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const deleteExpanse = asyncHandler(async (req, res) => {
  const expanseID = req.params?.expanseID;
  if (!expanseID) {
    throw new ApiError(400, "Expanse ID is required");
  }

  const expanse = await Expanse.findById(expanseID);
  if (!expanse) {
    throw new ApiError(404, "Expanse not found");
  }

  const mess = await Mess.findById(expanse.messID);
  if (!mess) {
    throw new ApiError(404, "Mess not found");
  }

  if (mess?.messAdmin.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete expanse");
  }

  mess.totalMoney = parseFloat(mess.totalMoney) + parseFloat(expanse.amount);

  await Expanse.findByIdAndDelete(expanseID);
  await mess.save();

  res
    .status(200)
    .json(new ApiResponse(200, mess, "Expanse deleted successfully"));
});

export { addExpanse, updateExpanse, getExpanse, deleteExpanse };
