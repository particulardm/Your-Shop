import { Request, Response } from "express";
import { connectDB, disconnectDB, pool } from "../../db/client";

interface ItemWithPrice {
    price: string;
}

// они пока ничего не возвращают и не дают никакой ответ клиенту, потом надо будет поправить
export const getAllItems = async function () {
    try {
        await connectDB();
        const allItemsQuery = "SELECT * FROM items";
        const allItems = await pool.query(allItemsQuery);
        console.log(allItems.rows);
        return allItems.rows;
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        // await disconnectDB();
    }
}

// пока не создаю полноценный интерфейс, потому что меня будет интересовать одно конкретное поле. 
// собственно, суть в том, что первым параметром функция принимает массив объектов, у которых будет поле price
export const sortItemsByPrice = function<T extends ItemWithPrice>(items: T[], cheaperFirst: boolean = true) {
    if (cheaperFirst) {
        items.sort( (a,b) => {
            const parsedA = parseFloat(a.price);
            const parsedB = parseFloat(b.price);
            return parsedA - parsedB;
        })
    }
    else {
        items.sort( (a,b) => {
            const parsedA = parseFloat(a.price);
            const parsedB = parseFloat(b.price);
            return parsedB - parsedA;
        })
    }

    console.log(items);
}