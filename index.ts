import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import authRouter from "./src/auth/authRoutes";
import itemsRouter from "./src/items/itemsRoutes";

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use(itemsRouter);

const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    console.log(`hello there`);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

