import{ Router} from 'express';
import { 
    createProjectControler,
    getAllProject ,
    addUserToProject,
    getProjectById

} from '../controllers/project.controler.js';   
import authUser from '../middleware/auth.middleware.js';
import { body } from 'express-validator';


const router = Router();

router.post('/create',authUser,
body('name').isString().withMessage('Name is required !!'), createProjectControler)

router.post('/my-projects',
    authUser,
    getAllProject
)

router.put('/add-user',
    authUser,
     body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    addUserToProject
)

router.route('/getprojectId').get(
    authUser,
    getProjectById
)




export default router;
