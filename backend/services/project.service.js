import mongoose from "mongoose";
import projectModel from "../models/project.model.js";


const createProject = async ( {name,userId})=>{

if(!name){
    throw new Error('Name is required');
}
if(!userId){
    throw new Error('userId is required');
}
let project;

 try {

    project = await projectModel.create({
       name,
       users: [userId]
   });

 

 } catch (error) {
    
    
        throw new Error('Project name already exists');
    

   
 }

return project;

}

const getAllProjectByUserID = async ({userId}) =>{
 if(!userId){
    throw new Error('UserId is required')
 }

 const allUserProjects = await projectModel.find({
    users: userId
 })


   return allUserProjects
}


const addUsersToProject = async({projectId, users, userId})=>{


   if( !projectId){

      throw new Error(" projectId is required **")

   }

   if(!mongoose.Types.ObjectId.isValid(projectId)){
      throw new Error ("Invalid projectId")
   }
   if( !users){
      throw new Error(" users is required")
   }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if(!userId){
      throw new Error("userid is required")
    }

    const project = await projectModel.findOne({
      _id: projectId,
      users: userId
    })
    
    if(!project){
      throw new Error(" User  not belong to this project")
    }
    const updatedProject = await projectModel.findOneAndUpdate({_id: projectId},{

      $addToSet:{

         users:{
            $each: users
         }
      }
    }, {
      new: true
    })
    

    return updatedProject

}

const getProjectUsingId = async ({projectId}) =>{

   
   
   if(!projectId) {

      throw new Error ("projectId is required")

   }

   if(!mongoose.Types.ObjectId.isValid(projectId)){
      throw new Error("Invalid projectId")
   }
   
   const project = await projectModel.findOne({

       _id: projectId,
     

   }).populate('users');

   return project

}


export  { createProject, getAllProjectByUserID, addUsersToProject, getProjectUsingId } 