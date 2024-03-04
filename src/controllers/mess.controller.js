import Mess from '../models/mess.model.js';
import { ApiError } from '../utils/ApiError.util.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import fs from 'fs';
import { uploadImageOnCloudinary } from '../utils/cloudinary.util.js';

const createNewMess =asyncHandler(async (req, res) => {
    const { messName, messDescription } = req.body;
    if(messName.trim() === "" || messDescription.trim() === ""){
        fs.unlinkSync(req.file?.path);
        throw new ApiError(400, "Mess Name and Description are required");
    }

    const admin = req.user._id;

    const alreadyExist = await Mess.findOne({messName, messAdmin: admin});
    if(alreadyExist){
        fs.unlinkSync(req.file?.path);
        throw new ApiError(400, "Mess already exists");
    }

    const messLogo = await uploadImageOnCloudinary(req.file?.path);

    if(!messLogo){
        fs.unlinkSync(req.file?.path);
        throw new ApiError(500, "Error while uploading image");
    }

    const newMess = await Mess.create({
        messName,
        messDescription,
        messLogo: messLogo.secure_url,
        messAdmin: admin,
    });

    if(!newMess){
        throw new ApiError(500, "Error while creating new mess");
    }

    res
    .status(201)
    .json({
        success: true,
        data: newMess,
        message: "Mess created successfully",
    });
});


export { createNewMess };
