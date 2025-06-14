
import {
  createProject, 
  getAllProjectByUserID,
  addUsersToProject,
  getProjectUsingId

} from "../services/project.service.js";

import { validationResult } from "express-validator";
import User from "../models/user.model.js";



const createProjectControler = async ( req, res ) => {

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
   
   }

   try {
     const { name } = req.body;
     
     const loggedInUser = await User.findOne({email: req.user.email });
     const userId = loggedInUser._id;

     const newProject = await createProject( {name, userId} );
     if (newProject) {
       console.log("project is created");
     }
     res.status(201).json({ message: "Project created successfully",
      project: newProject });
   } catch (error) {
     console.error("Error creating project:", error);
     res.status(500).json({ error: "Internal server error" });
   }
}

const getAllProject = async (req, res) =>{

  try{
    
   const loggedInUser = await User.findOne({email: req.user.email})
   
   const allUserProjects  = await getAllProjectByUserID({userId: loggedInUser._id})

   return res.status(200).json({
    projects: allUserProjects
   })

  }catch(err){

  console.log(err);
  res.status(400).json({ error: err.message})
  

  }
}

const addUserToProject = async(req,res) => {
  
  const errors  = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }

  try {

    const { projectId, users}  = req.body
    

    if (!projectId || !users) {
    return res.status(400).json({ message: 'projectId and userId are required' });
  }

    const loggedInUser = await User.findOne({
      email: req.user.email
    });

    const project = await addUsersToProject({projectId, users,userId: loggedInUser._id})

    return res.status(200).json({
      project
    })

  }catch (err) {

    console.log(err);

    res.status(400).json({ error: err.message})
    
  }


}

const getProjectById = async(req,res) => {

  const { projectId}  = req.body;

  

  try {
    
    
    const project = await getProjectUsingId({projectId})



    return res.status(200).json({
      project
    })

  } catch (error) {
    console.log(error)
    res.status(403).send(error.message)
    
  }

}

export { createProjectControler,getAllProject,addUserToProject , getProjectById }