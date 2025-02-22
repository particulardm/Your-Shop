import { connectDB, disconnectDB, pool } from "../../db/client";

interface Item {
    name: string;
}



// это часть большей функции, так что предполагаю что инпут уже валидирован. ошибки тоже буду ловить в большей функции
const addSingleItem = async function(item: Item, username: string) {
    // запрашиваем весь итем из дб
    // если такого итема вообще нет, ошибка
    // если итем есть, но не в наличии, ошибка
    // в корзине дб запрашиваем ЭТОТ итем ГДЕ юзер это текущий юзер
    // если такая строка есть
        // в корзине +1 количество, на складе -1
    // если такой строки нет, создаём и
    //  в корзине +1 количество, на складе -1

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
    // кроме того, зачем мне username и user_name? поправлю потом
    if (!foundCart.rows.length) {
        const insertCartQuery = "INSERT INTO carts (user_name, item_id, quantity) VALUES ($1, $2, 1)";
        const newRow = await pool.query(insertCartQuery, [username, foundItem.rows[0].id]);
    };
}



