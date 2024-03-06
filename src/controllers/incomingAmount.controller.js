import Mess from "../models/mess.model.js";
import User from "../models/user.model.js";
import IncomingAmount from "../models/incomingAmount.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import mongoose from "mongoose";


const addIncomingAmount = asyncHandler(async (req, res) => {
    try {
      const  messID  = req.params.messId;
      if (!messID) {
        throw new ApiError(400, "Mess Id is required");
      }
  
      const { memberId, amount } = req.body;
      if (!memberId || !amount) {
        throw new ApiError(400, "Member Id and Amount are required");
      }
  
      const mess = await Mess.findById(messID);
      if (!mess) {
        throw new ApiError(404, "Mess not found");
      }
  
      if (mess.messAdmin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to add incoming money");
      }
  
      const member = await User.findById(memberId);
      if (!member) {
        throw new ApiError(404, "Member not found");
      }
  
      const isMemberOfTheMess = mess.messMembers.find(m => m.toString() === member._id.toString());
      if (!isMemberOfTheMess) {
        throw new ApiError(400, "Member not in the mess");
      }
  
      const newIncomingAmount = await IncomingAmount.create({
        payedBy: memberId,
        messID,
        amount,
      });
      if (!newIncomingAmount) {
        throw new ApiError(500, "Error while adding incoming money");
      }
  
      mess.totalMoney = parseFloat(mess.totalMoney) + parseFloat(amount);
      await mess.save();
  
      res
      .status(201)
      .json(new ApiResponse(201, newIncomingAmount, "Incoming Money Added"));
  
    } catch (error) {
      throw new ApiError(500, error.message);
    }
});

const updateIncomingAmount = asyncHandler(async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        if (!transactionId) {
          throw new ApiError(400, "Transaction Id is required");
        }
    
        const { messID, memberId, amount } = req.body;
        if (!memberId || !amount || !messID) {
          throw new ApiError(400, "Member Id and Amount are required");
        }

        const incomingAmount = await IncomingAmount.findById(transactionId);
        if (!incomingAmount) {
          throw new ApiError(404, "Transaction not found");
        }

        if(incomingAmount.amount == amount){
            throw new ApiError(400, "No change in amount");
        }
    
        const mess = await Mess.findById(messID);
        if (!mess) {
          throw new ApiError(404, "Mess not found");
        }
    
        if (mess.messAdmin.toString() !== req.user._id.toString()) {
          throw new ApiError(403, "You are not authorized to update incoming money");
        }
    
        const member = await User.findById(memberId);
        if (!member) {
          throw new ApiError(404, "Member not found");
        }
    
        const isMemberOfTheMess = mess.messMembers.find(m => m.toString() === member._id.toString());
        if (!isMemberOfTheMess) {
          throw new ApiError(400, "Member not in the mess");
        }
    
        const previousAmount = incomingAmount.amount;
    
        incomingAmount.amount = amount;
    
        await incomingAmount.save();
    
        mess.totalMoney = parseFloat(mess.totalMoney) - parseFloat(previousAmount) + parseFloat(amount);
    
        await mess.save();
    
        res
        .status(200)
        .json(new ApiResponse(200, incomingAmount, "Incoming Money Updated"));
    } catch (error) {
        throw new ApiError(500, error.message);        
    }

});

const getIncomingTransactions = asyncHandler(async (req, res) => {
    try {
        const {page, limit} = req.query;
        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
        };
        const transactions= await IncomingAmount.aggregate([
            {
                $match: {
                    messID: new mongoose.Types.ObjectId(req.params.messId)
                }
            },    
            {
                $lookup: {
                    from: "users",
                    localField: "payedBy",
                    foreignField: "_id",
                    as: "payedBy"
                }
            },
            {
                $unwind: "$payedBy"
            },
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    createdAt: 1,
                    "payedBy._id": 1,
                    "payedBy.fullName": 1,
                    "payedBy.email": 1,
                    "payedBy.userName": 1,
                }
            }      
         ]).skip((options.page - 1) * options.limit).limit(options.limit);

        res
        .status(200)
        .json(new ApiResponse(200, transactions, "Incoming Transactions"));

        
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


export {
    addIncomingAmount,
    updateIncomingAmount,
    getIncomingTransactions
}