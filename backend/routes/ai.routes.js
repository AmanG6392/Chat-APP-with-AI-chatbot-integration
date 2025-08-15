import { Router } from "express";
import aiController from '../controllers/ai.controller.js'

const router = Router();

router.route('/get-airesult').get(aiController)

export default router;