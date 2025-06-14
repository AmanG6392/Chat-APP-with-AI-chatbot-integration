import User from "../models/user.model.js";


 const createUser = async ({email, password})=>{
    if(!email || ! password ){
        throw new Error('Email and password are required');
    }

    const ExistedUser = await User.findOne({email})
    if(ExistedUser){
        console.log("User is already existed ")
        process.exit(1)
    }


    const hashedPassword = await User.hashPassword(password);

    const user = await User.create({
        email, 
        password: hashedPassword
    });

    const createdUser = await User.findById(user._id).select("-password ")

    if(!createdUser){
        console.log("user does not created");
        
    }

    return user;
}

const getAllUser = async({userId}) =>{

    const users = await User.find({
        _id: {$ne: userId}
    });
    return users;
}



export  {createUser, getAllUser}