import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
import router from "./src/auth/routes";

const app = express();

app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    console.log(`hello there`);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

