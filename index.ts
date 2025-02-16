import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import authRouter from "./src/auth/authRoutes";
import itemsRouter from "./src/items/itemsRoutes";
import { getAllItems, sortItemsByPrice, searchForSingleItem } from "./src/items/itemsServices";

const app = express();

app.use(express.json());
app.use(authRouter);
app.use(itemsRouter);

const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    console.log(`hello there`);
    // try {
    //     const items = await getAllItems();
    //     sortItemByCategory(items, "Electronics");
    //     console.log(`hello there`);
    // } catch (err) {
    //     console.error(err);
    // }
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

