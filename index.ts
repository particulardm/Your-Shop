import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from "./db/client";

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    await connectDB();
    console.log(`hello there`);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

