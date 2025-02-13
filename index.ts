import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import router from "./src/auth/authRoutes";
import { getAllItems, sortItemsByPrice } from "./src/items/itemsServices";

const app = express();

app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    const items = await getAllItems();
    const sorted = sortItemsByPrice(items, false);
    console.log(`hello there`);
    console.log(sorted);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

