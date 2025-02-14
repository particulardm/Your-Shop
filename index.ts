import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import router from "./src/auth/authRoutes";
import { getAllItems, sortItemsByPrice, searchForSingleItem } from "./src/items/itemsServices";

const app = express();

app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    // const items = await getAllItems();
    try {
        const res = await searchForSingleItem('iPhone ');
        console.log(`hello there`);
        console.log(res);
    } catch (err) {
        console.error(err);
    }
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

