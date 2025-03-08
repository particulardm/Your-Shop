import { connectDB, disconnectDB, pool } from "../../db/client";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";


export const buy = async function (req: Request, res: Response) {
    const { username } = req.user as JwtPayload;

    try {
        await connectDB();
        await buyCurrentCart(username);
        res.status(200).json({
            success: "items bought"
        })
    } catch (err) {
        res.status(400).json({
            error: err
        })
        console.error(err);
    }
};

const buyCurrentCart = async function (username: string) {
    // запрашиваем корзину для ЮЗЕРНЕЙМ из базы
    const searchCartQuery = "SELECT * FROM carts WHERE user_name = $1";
    const searchCartResult = await pool.query(searchCartQuery, [ username ]);
    // смотрим, чтобы была не пустая
    if (searchCartResult.rows.length < 1) {
        throw new Error("can't buy an empty cart..");
    }
    let totalPrice = 0;
    for (const item of searchCartResult.rows) {
        const searchItemQuery = "SELECT * FROM items WHERE id = $1";
        const searchItemResult = await pool.query(searchItemQuery, [ item["item_id"] ]);

        totalPrice += searchItemResult.rows[0].price * item.quantity;
    }
    console.log("total price for user of ", username, " is ", totalPrice);
    // смотрим, чтобы было достаточно денег
    const searchUserQuery = "SELECT * FROM users WHERE username = $1";
    const searchUserResult = await pool.query(searchUserQuery, [ username ]);
    if (searchUserResult.rows[0].deposit < totalPrice) {
        throw new Error("not enough money to buy items");
    }
    // списываем средства
    const updateUserDepositQuery = "UPDATE users SET deposit = deposit - $1 WHERE username = $2";
    const updateUserDepositResult = await pool.query(updateUserDepositQuery, [ Math.floor(totalPrice), username ]);
    // сохраняем транзакцию в историю 
    const saveWholePurchaseQuery = "INSERT INTO purchases (username, total_amount) VALUES ($1, $2) RETURNING purchase_id";
    const saveWholePurchaseResult = await pool.query(saveWholePurchaseQuery, [ username, totalPrice ]);
    console.log("the purchase is saved to db..");
    console.log("returns:", saveWholePurchaseResult.rows[0]["purchase_id"]);

    const saveSingleItemPurchaseQuery = `INSERT INTO purchase_items (purchase_id, price, item_id, quantity) VALUES (${saveWholePurchaseResult.rows[0]["purchase_id"]}, 1, $1, $2)`;
    for (const item of searchCartResult.rows) {
        const saveSingleItemPurchaseResult = await pool.query(saveSingleItemPurchaseQuery, [ item["item_id"], item.quantity ]);
    };
    console.log("the purchases items are saved to db as well..");
    // обнуляем корзину
    const clearCartQuery = "DELETE FROM carts WHERE user_name = $1";
    const clearCartResult = await pool.query(clearCartQuery, [ username ]);
}