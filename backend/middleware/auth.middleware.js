import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redisClient from "../services/redis.service.js";

const authUser = async (req, res, next) => {

    try{
    
      
        const token = await req.cookies.token || req.headers.authorization.split(' ')[ 1 ];
        
        if(!token){ 

            return res.status(401).send({ error: 'Unauthorized User' });
        }
         
      const isBlackListed = await redisClient.get(token);  
        
      if(isBlackListed){ 
        
        res.cookie('token', '')
        return res.status(401).send({error: 'Unauthorized User '})
      }
      const decodedToken =  jwt.verify(token, process.env.JWT_secret);

      const user = await User.findOne(decodedToken?._id).select('-password')

      if(!user){
        
        return res.status.json(401, "Invalid access Token")

      }
      

      // req.user = user;
      req.user = decodedToken;
      next();

    }catch(error){
       
        console.log(error);
        
      res.status(401).send({error: 'unauthorized User --'});

    }
}

export default authUser