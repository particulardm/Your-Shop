import express from "express";
import { createUser,  loginUser } from "./authServices";

const router = express.Router();

router.route('/auth')
    .post(createUser)
    .get(loginUser)

export default router;