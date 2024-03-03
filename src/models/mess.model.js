import { Schema, model } from "mongoose";


const messSchema = new Schema({
    messName:{
        type: String,
        required: [true, "Mess Name is required"],
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    },
    messDescription:{
        type: String,
        required: [true, "Description is required"],
    },
    messAvatar:{
        type: String,
        required: [true, "Avatar is required"],
    },
    messAdmin:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    messMembers:[
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    
    totalMoney:{
        type: Number,
        default: 0,
    },

    messMenu:[
        {
            type: String,
        }
    ],

},{timestamps: true});


export default model("Mess", messSchema);