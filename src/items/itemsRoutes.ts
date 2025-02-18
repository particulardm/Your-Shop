import express from "express";
import { getAllItems, searchForSingleItem, sortItems } from "./itemsServices";
import { checkToken } from "../middlewares/checkJwtToken";

const router = express.Router();

router.get('/items', checkToken, getAllItems);
router.post('/items/sort', sortItems);

export default router;