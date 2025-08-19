import User from "../models/user.model.js";
import {createUser,getAllUser} from '../services/user.service.js'
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";



 const createUserController = async (req, res) => {
      
    const errors = validationResult(req);
    if( !errors.isEmpty()) {

        return res.status(400).json({errors: errors.array() });
    }

    try {
        const user = await createUser(req.body);
         if(user){console.log("user is created");
         }

        //const token = await User.generateJWT();
        const token = await user.generateJWT();
        console.log("token",token);
        
        
        res.status(201).send({user,token});
    } catch(error){
        res.status(400).send(error.message);
    }
}

 const loginController = async(req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    try {
        
        const { email, password }  = req.body;

        const user = await User.findOne({email}).select('+password')
           
        if(!user) {
           return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }
        
        const Ismatchpassword =  await user.isvalidPassword(password);
        if(!Ismatchpassword){
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }
       
        const token = await user.generateJWT();
         

        delete user._doc.password;
        
          res.status(200).json({  
            user, 
            token,
            "message":" You logged in successfully"
            });

 
    }catch(err){
        console.log("error: ");
        
        res.status(400).send(err);
    }
}

const profilecontroller = async(req,res) => {

    console.log(req.user);

    res.status(200).json({
        user: req.user
    });
    
}

const logoutController = async (req,res)=> {
    try{
       
        const token = req.cookies?.token || req.headers.authorization.split(' ')[ 1 ];
      
        redisClient.set(token, 'logout', 'EX', 60* 60* 24)

        res.status(200).json({
            message: " logged out successfully"
        });
        
    }catch(error){

        console.log(error)
        res.status(400).send(error.message)
    }
}

const getAllUserController = async(req,res) =>{
    try {

        const loggedInUser = await User.findOne({
            email: req.user.email
        })

        if(!loggedInUser){
            return res.json({
                "message":"Unauthorized user : you have no account  first signUp then only youn can get user"});
        }

        const allUsers = await getAllUser({userId :loggedInUser._id});

        return res.status(200).json({
             users : allUsers })
        

        
    } catch (error) {
        console.log(error)

      res.status(402).send(error)
        
    }
}


export  {createUserController, loginController , profilecontroller ,logoutController,getAllUserController}