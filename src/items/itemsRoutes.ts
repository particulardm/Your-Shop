import express from "express";
import { getAllItems, searchForSingleItem, sortItems } from "./itemsServices";

const router = express.Router();

router.get('/items', getAllItems)
router.post('/items/sort', sortItems);

export default router;