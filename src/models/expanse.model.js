import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const expanseSchema = new mongoose.Schema({
    expanseFor : {
        type: String,
        required: [true, "Expanse Reason is required"],
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

expanseSchema.plugin(mongooseAggregatePaginate);


export default mongoose.model("Expanse", expanseSchema);