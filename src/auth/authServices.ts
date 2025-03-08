import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { connectDB, disconnectDB, pool } from "../../db/client";
import jwt  from "jsonwebtoken";

interface User {
    username: string;
    password: string;
}

export const createUser = async function (req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({
            error: "please provide correct user data"
        })
        console.error("user provided incorrect data for registration");
        return;
    }

    try {
        await createUserInDB({ username, password });
        res.status(200).json({
            success: "new user created successfully"
        })
    } catch (err) {
        res.status(400).json({
            error: err
        })
    }
}

export const loginUser = async function (req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({
            error: "please provide correct user data"
        })
    }

    try {
        const jwtToken = await giveTokenIfPasswordMatches({ username, password });
        res.status(200).json({
            message: "your token:",
            token: jwtToken
        })
    } catch (err) {
        res.status(400).json({
            error: err
        })
    }
    
}

const createUserInDB = async function (user: User) {
    try {
        await connectDB();

        const checkLoginQuery = "SELECT username FROM users WHERE username = $1";
        const checkLoginResult = await pool.query(checkLoginQuery, [user.username]);
        console.log('check login result:', checkLoginResult.rows);
        if (checkLoginResult.rows.length > 0) {
            throw new Error("Username already exists, apparently");
        }

        // вот теперь считаем, что получили нормальный инпут, можем захэшировать полученный пароль и создать нового юзера; 

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        const query = "INSERT INTO users (username, password) VALUES ($1, $2)";
        const newUser = await pool.query(query, [user.username, hashedPassword]);
        console.log("user created..");
    } catch (err) {
        console.error(err);
        throw err;
    } 
}

// в успешном случае возвращает строку, которая и будет jwt-токеном
const giveTokenIfPasswordMatches = async function (user: User) {
    try {
        await connectDB();

        const query = "SELECT password FROM users WHERE username = $1";
        const rowWithHashedPassword = await pool.query(query, [user.username]);

        const hashedPassword = rowWithHashedPassword.rows[0].password;
        const hashMatches = await bcrypt.compare(user.password, hashedPassword);

        if (hashMatches) {
            console.log('can proceed to token');
            const userID = rowWithHashedPassword.rows[0].id;
            const userData = { username: user.username, id: userID };
            const secretKey = process.env.SECRET_KEY as string;
            const token = jwt.sign(userData, secretKey, { expiresIn: '1000h' });
            return token;
        }
        else throw new Error("either login or password is incorrect");
    } catch (err) {
        console.error(err);
        throw err;
    } 
}

// я предполагаю, что функция хотя бы получила нормальный инпут, потому что эта проверка будет сделана раньше
export const verifyUser = function (jwtToken: string) {
    const secretKey = process.env.SECRET_KEY as string;
    jwt.verify(jwtToken, secretKey);
}


// console.log(rowWithHashedPassword.rows):
// [
//     {
//       password: '$2b$10$t865eU8lnfP0lxrUEpml2.vPYtgZk0ZmTQudhTASRV1aYzFwHOwW6'
//     },
//     {
//       password: '$2b$10$m.vnk5URtvXm9Fg.aD78eugz3jbU.9SjzY9CPvHwQobssVyv7VyA2'
//     }
//   ]