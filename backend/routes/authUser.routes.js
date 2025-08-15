import { Router } from "express";
import authUser from '../middleware/auth.middleware.js';


const router = Router();

router.route('/me').get(authUser, (req, res) => {
  res.json(req.user);
})

export default router;
