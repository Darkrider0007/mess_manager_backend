import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const incomingAmountSchema = new mongoose.Schema({
    payedBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    description : {
        type: String,
        required: [true, "Description is required"],
    },
    messID : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mess",
        required: [true, "Mess Id is required"],
    },
    amount : {
        type: Number,
        default: 0,
    },
},{timestamps: true});

incomingAmountSchema.plugin(mongooseAggregatePaginate);


export default mongoose.model("IncomingAmount", incomingAmountSchema);