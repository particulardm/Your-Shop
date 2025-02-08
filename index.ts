import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from "./db/client";
import { createUser, loginUser } from "./src/auth/services";

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', async () => {
    createUser({
        username: "kvas",
        password: "123456"
    })
    console.log(`hello there`);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

