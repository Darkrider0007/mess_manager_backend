import Mess from "../models/mess.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import fs from "fs";
import { deleteImageFromCloudinary, uploadImageOnCloudinary } from "../utils/cloudinary.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const createNewMess = asyncHandler(async (req, res) => {
  try {
    const { messName, messDescription } = req.body;
    if (messName.trim() === "" || messDescription.trim() === "") {
      fs.unlinkSync(req.file?.path);
      throw new ApiError(400, "Mess Name and Description are required");
    }

    const admin = req.user._id;

    const alreadyExist = await Mess.findOne({ messName, messAdmin: admin });
    if (alreadyExist) {
      fs.unlinkSync(req.file?.path);
      throw new ApiError(400, "Mess already exists");
    }

    const imageLocalPath = req.file?.path;
    if (!imageLocalPath) {
      throw new ApiError(400, "Mess Logo is required");
    }

    const messLogo = await uploadImageOnCloudinary(imageLocalPath);

    if (!messLogo) {
      throw new ApiError(500, "Error while uploading image");
    }

    const newMess = await Mess.create({
      messName,
      messDescription,
      messLogo: messLogo.secure_url,
      messAdmin: admin,
      messMembers: [admin],
    });

    if (!newMess) {
      throw new ApiError(500, "Error while creating new mess");
    }

    res.status(201).json(new ApiResponse(201, newMess, "Mess Created"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getMessInfo = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const mess = await Mess.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(messId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "messMembers",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          _id: 1,
          messName: 1,
          messDescription: 1,
          messLogo: 1,
          totalMoney: 1,
          messMenu: 1,
          messAdmin: 1,
          members: {
            _id: 1,
            userName: 1,
            fullName: 1,
            email: 1,
            userAvatar: 1,
          },
        },
      },
    ]);

    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    res.status(200).json(new ApiResponse(200, mess[0], "Mess Info"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const addMemberToMess = asyncHandler(async (req, res) => {
  try {
    const { messId, memberId } = req.body;
    if (memberId.trim() === "" || messId.trim() === "") {
      throw new ApiError(400, "Mess Id and Member Id are required");
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess.messAdmin.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to add member");
    }

    const member = await User.findById(memberId);
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const alreadyMember = mess.messMembers.find(m => m.toString() === memberId);
    if (alreadyMember) {
      throw new ApiError(400, "Member already in the mess");
    }

    mess.messMembers.push(memberId);
    await mess.save();

    res
      .status(200)
      .json(new ApiResponse(200, { "member ID": memberId }, "Member Added"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const removeMemberFromMess = asyncHandler(async (req, res) => {
  const { messId, memberId } = req.body;
  if (memberId.trim() === "" || messId.trim() === "") {
    throw new ApiError(400, "Mess Id and Member Id are required");
  }

  const mess = await Mess.findById(messId);
  if (!mess) {
    throw new ApiError(404, "Mess not found");
  }

  if (mess.messAdmin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to remove member");
  }

  const removedMember = mess.messMembers.filter(m => m.toString() !== memberId);

  mess.messMembers = removedMember;

  await mess.save();

  res
    .status(200)
    .json(new ApiResponse(200, { "member ID": memberId }, "Member Removed"));
});

const getMessMembersInfo = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const messMembers = await Mess.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(messId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "messMembers",
          foreignField: "_id",
          as: "members",
        },
      },
      {
        $project: {
          messAdmin: 1,
          members: {
            _id: 1,
            userName: 1,
            fullName: 1,
            email: 1,
            userAvatar: 1,
          },
        },
      },
    ]);

    res.status(200).json(new ApiResponse(200, messMembers, "Members Info"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const updateMessInfo = asyncHandler(async (req, res) => {
    try {
        const messId = req.params.messId;
        if (!messId) {
        throw new ApiError(400, "Mess Id is required");
        }

        const { messName, messDescription } = req.body;

        if (messName?.trim() === "" && messDescription?.trim() === "") {
        throw new ApiError(400, "Mess Name or Description is required");
        }
    
        const updateObject = {};
        if (messName) {
            updateObject.messName = messName;
        }
        if (messDescription) {
            updateObject.messDescription = messDescription;
        }

        const updatedMessInfo = await Mess.findByIdAndUpdate(messId, {
            $set: updateObject
        }, { new: true });

        if (!updatedMessInfo) {
            throw new ApiError(500, "Error while updating mess info");
        }

        res.status(200).json(new ApiResponse(200, updatedMessInfo, "Mess Info Updated"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const updateMessLogo = asyncHandler(async (req, res) => {
    try {
        const messId = req.params.messId;
        if (!messId) {
        throw new ApiError(400, "Mess Id is required");
        }

        const mess = await Mess.findById(messId);
        if (!mess) {
        throw new ApiError(404, "Mess not found");
        }

        if (mess.messAdmin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update mess logo");
        }

        const messLogo = await uploadImageOnCloudinary(req.file?.path);
        if (!messLogo) {
        fs.unlinkSync(req.file?.path);
        throw new ApiError(500, "Error while uploading image");
        }
        const messOldLogo = mess.messLogo;

        mess.messLogo = messLogo.secure_url;
        
        await mess.save();

        await deleteImageFromCloudinary(messOldLogo);

        res.status(200).json(new ApiResponse(200, mess, "Mess Logo Updated"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
})

const updateMessAdmin = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const { newAdminId } = req.body;
    if (!newAdminId) {
      throw new ApiError(400, "New Admin Id is required");
    }

    const userExist = await User.findById(newAdminId);
    if (!userExist) {
      throw new ApiError(404, "Cannot change admin to non-existing user");
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess.messAdmin.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to change admin");
    }

    const isMemberOfTheMess = mess.messMembers.find(m => m.toString() === newAdminId);

    if(!isMemberOfTheMess) {
      throw new ApiError(400, "New Admin is not a member of the mess");
    }

    mess.messAdmin = newAdminId;
    await mess.save();

    res.status(200).json(new ApiResponse(200, mess, "Mess Admin Updated"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const addMessMenu = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const { menu } = req.body;
    if (!menu) {
      throw new ApiError(400, "Menu is required");
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess.messAdmin.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to add menu");
    }

    mess.messMenu.push(menu);
    await mess.save();

    res.status(200).json(new ApiResponse(200, mess, "Menu Added"));
    
  } catch (error) {
    throw new ApiError(500, error.message);    
  }
});

const removeMessMenu = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const { menu } = req.body;
    if (!menu) {
      throw new ApiError(400, "Menu is required");
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess.messAdmin.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to remove menu");
    }

    const removedMenu = mess.messMenu.filter(m => m !== menu);
    mess.messMenu = removedMenu;
    await mess.save();

    res.status(200).json(new ApiResponse(200, mess, "Menu Removed"));
    
  } catch (error) {
    throw new ApiError(500, error.message);    
  }
});

const deleteMess = asyncHandler(async (req, res) => {
  try {
    const messId = req.params.messId;
    if (!messId) {
      throw new ApiError(400, "Mess Id is required");
    }

    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new ApiError(404, "Mess not found");
    }

    if (mess.messAdmin.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete mess");
    }

    const messLogo = mess.messLogo;

    await Mess.findByIdAndDelete(messId);

    await deleteImageFromCloudinary(messLogo);

    res.status(200).json(new ApiResponse(200, {}, "Mess Removed"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export {
  createNewMess,
  getMessInfo,
  addMemberToMess,
  removeMemberFromMess,
  getMessMembersInfo,
  updateMessInfo,
  updateMessLogo,
  updateMessAdmin,
  addMessMenu,
  removeMessMenu,
  deleteMess,
};
