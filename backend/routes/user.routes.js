import { Router } from "express";
import {createUserController,
        loginController,
        profilecontroller,
        logoutController,
        getAllUserController

    } from '../controllers/user.controller.js';
import authUser from "../middleware/auth.middleware.js";
import { body } from 'express-validator'

const router = Router();

router.post( '/register',
    body('email').isEmail().withMessage('Email must be valid email address'),
    body('password').isLength({min: 6}).withMessage('password must be at least of 6 digit'),
    createUserController);

router.post( '/login',
    body('email').isEmail().withMessage('Email must be valid email address'),
    body('password').isLength({min: 6}).withMessage('password must be at least of 6 digit'),
    loginController);
router.route('/profile').get(authUser, profilecontroller);

router.route('/logout').get(authUser,logoutController);

router.route("/allUsers").get(authUser,getAllUserController)

export default router