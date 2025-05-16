import { connectDB, disconnectDB, pool } from "../../db/client";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

interface Item {
    name: string;
}


export const addItem = async function (req: Request, res: Response) {
    const item = req.body;
    // я могу сделать так, как ниже, потому что это будет защищённый эндпоинт
    // checkJWtToken сейчас написан таким образом, что если уж дело дойдёт сюда, то реквест придёт объектом jwt
    const { username } = req.user as JwtPayload;

    if (!item.name) {
        res.status(400).json({
            error: "please provide correct item to add"
        })
        return;
    }

    try {
        await connectDB();
        await addSingleItem(item, username);
        res.status(200).json({
            success: "item added to the cart"
        })
    } catch (err) {
        res.status(400).json({
            error: err
        })
        console.error(err);
    }
}

export const deleteItem = async function (req: Request, res: Response) {
    const item = req.body;
    const { username } = req.user as JwtPayload;

    if (!item.name) {
        res.status(400).json({
            error: "please provide correct item to delete"
        })
        return;
    }

    try {
        await connectDB();
        await deleteSingleItem(item, username);
        res.status(200).json({
            success: "item deleted from the cart"
        })
    } catch (err) {
        res.status(400).json({
            error: err
        })
        console.error(err);
    }
}




// это часть большей функции, так что предполагаю что инпут уже валидирован. ошибки тоже буду ловить в большей функции
const addSingleItem = async function(item: Item, username: string) {
    // запрашиваем весь итем из дб
    // если такого итема вообще нет, ошибка
    // если итем есть, но не в наличии, ошибка
    // в корзине дб запрашиваем ЭТОТ итем ГДЕ юзер это текущий юзер
    // если такая строка есть

    const searchItemQuery = "SELECT * FROM items WHERE name = $1";
    const foundItem = await pool.query(searchItemQuery, [item.name]);
    console.log(foundItem.rows);

    if (!foundItem.rows.length) {
        throw new Error("this item doesn't exist, sadly");
    }
    if (foundItem.rows[0].quantity < 1) {
        throw new Error("there isn't enough items");
    }

    const searchInCartQuery = "SELECT * FROM carts WHERE user_name = $1 AND item_id = $2";
    const foundCart = await pool.query(searchInCartQuery, [username, foundItem.rows[0].id]);

    // если для этого юзера ещё не добавлено такого товара, добавляем;
    if (!foundCart.rows.length) {
        const insertCartQuery = "INSERT INTO carts (user_name, item_id, quantity) VALUES ($1, $2, 1)";
        const newRow = await pool.query(insertCartQuery, [username, foundItem.rows[0].id]);
    }
    else {
        const updateCartQuery = "UPDATE carts SET quantity = quantity + 1 WHERE user_name = $1 AND item_id = $2";
        const updatedRow = await pool.query(updateCartQuery, [username, foundItem.rows[0].id]);
    }

    console.log("item added / changed");
}

const deleteSingleItem = async function (item: Item, username: string) {

    const searchItemQuery = "SELECT * FROM items WHERE name = $1";
    const searchItemResult = await pool.query(searchItemQuery, [item.name]);

    if (searchItemResult.rows.length < 1) {
        throw new Error("no such item at all");
    }

    const updateCartQuery = "UPDATE carts SET quantity = quantity - 1 WHERE user_name = $1 AND item_id = $2 RETURNING *";
    const updateCartResult = await pool.query(updateCartQuery, [username, searchItemResult.rows[0].id]);
    console.log(updateCartResult);

    if (updateCartResult.rows[0].quantity < 1) {
        const deleteCartQuery = "DELETE FROM carts WHERE user_name = $1 AND item_id = $2";
        const deleteCartResult = pool.query(deleteCartQuery, [username, searchItemResult.rows[0].id]);
    }

    console.log("item deleted / corrected");
}

export const getCart = async function (req: Request, res: Response) {
    const { username } = req.user as JwtPayload;

    try {
        const searchCartQuery = "SELECT * FROM carts WHERE user_name = $1";
        const searchCartResult = await pool.query(searchCartQuery, [ username ]);

        let totalPrice = 0;
        for (const item of searchCartResult.rows) {
            if (item["item_id"]) {
                const itemQueryResult = await pool.query("SELECT * FROM items WHERE id = $1", [ item["item_id"] ]);
                totalPrice += itemQueryResult.rows[0].price * item.quantity;
            }
        }

        res.status(200).json({
            cart: searchCartResult.rows,
            totalPrice
        });
    } catch (err) {
        res.status(400).json({ error: err });
        console.error(err);
    }
}
