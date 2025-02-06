import bcrypt from "bcrypt";
import { connectDB, disconnectDB, pool } from "../../db/client";

interface User {
    username: string;
    password: string;
}

export const createUser = async function(user: User) {
    try {
        await connectDB();

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        const query = "INSERT INTO users (username, password) VALUES ($1, $2)";
        const newUser = await pool.query(query, [user.username, hashedPassword]);
        console.log(newUser.rows);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        await disconnectDB();
    }
}