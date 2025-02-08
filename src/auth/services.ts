import bcrypt from "bcrypt";
import { connectDB, disconnectDB, pool } from "../../db/client";
import jwt  from "jsonwebtoken";

interface User {
    username: string;
    password: string;
}

export const createUser = async function (user: User) {
    try {
        if (!user.username || !user.password) {
            throw new Error("Username and password are required");
        }

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
    } finally {
        await disconnectDB();
    }
}

// в успешном случае возвращает строку, которая и будет jwt-токеном
export const loginUser = async function (user: User) {
    try {
        if (!user.username || !user.password) {
            throw new Error("Username and password are required");
        }

        await connectDB();

        const query = "SELECT password FROM users WHERE username = $1";
        const rowWithHashedPassword = await pool.query(query, [user.username]);

        const hashedPassword = rowWithHashedPassword.rows[0].password;
        const hashMatches = await bcrypt.compare(user.password, hashedPassword);

        if (hashMatches) {
            console.log('can proceed to token');
            const userData = { username: user.username };
            const secretKey = process.env.SECRET_KEY as string;
            const token = jwt.sign(userData, secretKey, { expiresIn: '1h' });
            return token;
        }
        else throw new Error("either login or password is incorrect");
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        await disconnectDB();
    }
}

// я предполагаю, что функция хотя бы получила нормальный инпут, потому что эта проверка будет сделана раньше
export const verifyUser = function (jwtToken: string) {
    const secretKey = process.env.SECRET_KEY as string;

    try {
        jwt.verify(jwtToken, secretKey);
    } catch (err) {
        throw err;
    }
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