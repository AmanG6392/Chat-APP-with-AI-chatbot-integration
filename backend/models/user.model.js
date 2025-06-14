import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true, 
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [ 6,'Email must be at least 6 characters long'],
        maxLength: [50,'Email must not be more than 50 characters']
    },
    password:{
        type: String
    }
})

userSchema.statics.hashPassword = async function(password){
    return await bcrypt.hash(password,10);
}

userSchema.methods.isvalidPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

// userSchema.methods.generateJWT = function (){
//     return jwt.sign({email: this.email}, process.env.JWT_secret)
// }

userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { email: this.email },
        process.env.JWT_secret,
        { expiresIn: '24h' }
    );
}


const User =  mongoose.model('User', userSchema);

export default User;