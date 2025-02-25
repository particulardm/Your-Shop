import express from "express";
import { addItem } from "./cartServices";
import { checkToken } from "../middlewares/checkJwtToken";
const router = express.Router();

router.post('/add', checkToken, addItem);

export default router;