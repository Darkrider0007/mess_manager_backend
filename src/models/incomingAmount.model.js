import mongoose from "mongoose";


const incomingAmountSchema = new mongoose.Schema({
    payedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    amount : {
        type: Number,
        default: 0,
    },
},{timestamps: true});


export default mongoose.model("IncomingAmount", incomingAmountSchema);