import express from "express";
import { getCart, addItem, deleteItem } from "./cartServices";
import { checkToken } from "../middlewares/checkJwtToken";
const router = express.Router();

router.get('/', checkToken, getCart);
router.post('/add', checkToken, addItem);
router.post('/delete', checkToken, deleteItem);

export default router;