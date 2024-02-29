import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
{
    userName:{
        type: String,
        required: [true, "User Name is required"],
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    },
    fullName:{
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email:{
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    userAvatar:{
        type: String, //Cloudinary URL
        required: [true, "Avatar is required"],
    },
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken:{
        type: String
    }       
}, { timestamps: true });


userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            userName: this.userName,
            userAvatar: this.userAvatar
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_LIFE
        }
    )
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_LIFE
        }
    )
}


export default mongoose.model('User', userSchema);