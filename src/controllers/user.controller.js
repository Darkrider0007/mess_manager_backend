import {asyncHandler} from '../utils/asyncHandler.util.js';
import {ApiResponse} from '../utils/ApiResponse.util.js';
import {ApiError} from '../utils/ApiError.util.js';
import User from '../models/user.model.js';


const registerUser = asyncHandler(async (req, res) => {
 const { name, email, password } = req.body;
 console.log(name);
});

export {registerUser};