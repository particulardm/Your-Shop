import express from "express";
import { checkToken } from "../middlewares/checkJwtToken";
import { buy } from "./buyingServices";

const router = express.Router();

router.post('/', checkToken, buy);

export default router;
