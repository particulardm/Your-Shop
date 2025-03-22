import { connectDB, disconnectDB, pool } from "../../db/client";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";


export const buy = async function (req: Request, res: Response) {
    const { username } = req.user as JwtPayload;
    
    const { coupon }: { coupon?: string} = req.body;
    let discountValue = 0;
    let discountType: "absolute" | "percent" = "absolute";
    let couponID;

    // найти купон и валидировать его
    // потом нужна будет логика для того, чтобы использование купона отображалось в базе данных
    try {
        await connectDB();

        if (coupon) {
            console.log("coupon noticed with the following code:", coupon);
            const searchCouponQuery = "SELECT * FROM coupons WHERE coupon_code = $1";
            const searchCouponResult = await pool.query(searchCouponQuery, [ coupon ]);
            

            if (searchCouponResult.rows.length < 1 || !searchCouponResult.rows[0]["is_active"]) {
                console.log("coupon was provided but is either not found or invalid");
            }
            else {
                discountValue = searchCouponResult.rows[0]["discount_value"];
                couponID = searchCouponResult.rows[0]["coupon_id"];
                
                if (searchCouponResult.rows[0]["discount_type"].trim() === "percent") {
                    discountType = "percent";

                    // лучше это на стороне бд делать, но предположим у меня нет доступа к бд и я не до конца доверяю данным оттуда,
                    // с такой грубой проверкой могу быть уверен, по крайней мере, что не скину всю цену где-нибудь из-за того, что в бд напутаны абсолютные и процентные купоны
                    if (searchCouponResult.rows[0]["discount_value"] > 50) {
                        discountValue = 50;
                    };
                }
                // теперь надо подогнать логику под расчёт скидки по-разному в зависимости от дискаунт тайпа
                // я могу задать дефолтный дискаунт тайп как абсолютный и просто менять его здесь, если потребуется
            }
        }
        await buyCurrentCart(username, discountType, discountValue, couponID);
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

const buyCurrentCart = async function (username: string, discountType: "absolute" | "percent", discountValue: number, couponID?: number) {
    // запрашиваем корзину для ЮЗЕРНЕЙМ из базы
    // const searchCartQuery = "SELECT * FROM carts WHERE user_name = $1";
    // const searchCartResult = await pool.query(searchCartQuery, [ username ]);
    // смотрим, чтобы была не пустая
    const userCart = await getUserCart(username);
    if (userCart.length < 1) {
        throw new Error("can't buy an empty cart..");
    }

    let totalPrice = await calculateTotalPrice(userCart);
    // for (const item of userCart) {
    //     const searchItemQuery = "SELECT * FROM items WHERE id = $1";
    //     const searchItemResult = await pool.query(searchItemQuery, [ item["item_id"] ]);

    //     totalPrice += searchItemResult.rows[0].price * item.quantity;
    // }
    
   

    // дефолтно у скидки абсолютный дискаунт тайп, так что просто приравниваем её к переданному вэлью
    // если передан персент тайп, то сразу корректируем
    let totalDiscount = discountValue;
    if (discountType === "percent") {
        totalDiscount = totalPrice / 100 * discountValue;
    }
    console.log ("discount type is ", discountType, " and total discount is ", totalDiscount);
    totalPrice -= totalDiscount;

    console.log("total price AFTER discount for user of ", username, " is ", totalPrice);
    // смотрим, чтобы было достаточно денег
    await checkIfEnoughMoney(username, totalPrice);
    // const searchUserQuery = "SELECT * FROM users WHERE username = $1";
    // const searchUserResult = await pool.query(searchUserQuery, [ username ]);
    // if (searchUserResult.rows[0].deposit < totalPrice) {
    //     throw new Error("not enough money to buy items");
    // }
    // списываем средства
    await chargeUser(username, totalPrice);
    // const updateUserDepositQuery = "UPDATE users SET deposit = deposit - $1 WHERE username = $2";
    // const updateUserDepositResult = await pool.query(updateUserDepositQuery, [ Math.floor(totalPrice), username ]);
    // сохраняем транзакцию в историю 
    await savePurchaseToHistory(username, totalPrice, userCart);
    // const saveWholePurchaseQuery = "INSERT INTO purchases (username, total_amount) VALUES ($1, $2) RETURNING purchase_id";
    // const saveWholePurchaseResult = await pool.query(saveWholePurchaseQuery, [ username, totalPrice ]);
    // console.log("the purchase is saved to db..");
    // console.log("returns:", saveWholePurchaseResult.rows[0]["purchase_id"]);

    // const saveSingleItemPurchaseQuery = `INSERT INTO purchase_items (purchase_id, price, item_id, quantity) VALUES (${saveWholePurchaseResult.rows[0]["purchase_id"]}, 1, $1, $2)`;
    // for (const item of userCart) {
    //     const saveSingleItemPurchaseResult = await pool.query(saveSingleItemPurchaseQuery, [ item["item_id"], item.quantity ]);
    // };
    // console.log("the purchases items are saved to db as well..");
    // запоминаем, что купон был использован
    // const addCouponUsageQuery = "INSERT INTO coupon_usage (coupon_id, username, discount_applied) VALUES ($1, $2, $3)";
    // const addCouponUsageResult = await pool.query(addCouponUsageQuery, [ couponID, username, totalDiscount ]);
    if (couponID) {
        await saveCouponUseToHistory(username, totalDiscount, couponID);
    }

    // обнуляем корзину
    // const clearCartQuery = "DELETE FROM carts WHERE user_name = $1";
    // const clearCartResult = await pool.query(clearCartQuery, [ username ]);

    await clearUserCart(username);
}



// хелперы
const getUserCart = async (username: string) => {
    const searchCartQuery = "SELECT * FROM carts WHERE user_name = $1";
    const searchCartResult = await pool.query(searchCartQuery, [ username ]);

    return searchCartResult.rows;
};

const calculateTotalPrice = async (userCart: any[]) => {
    let totalPrice = 0;

    for (const item of userCart) {
        const searchItemQuery = "SELECT * FROM items WHERE id = $1";
        const searchItemResult = await pool.query(searchItemQuery, [ item["item_id"] ]);

        totalPrice += searchItemResult.rows[0].price * item.quantity;
    }
    console.log("total price BEFORE discount ", totalPrice);
    
    return totalPrice;
};

const checkIfEnoughMoney = async (username: string, totalPrice: number) => {
    const searchUserQuery = "SELECT * FROM users WHERE username = $1";
    const searchUserResult = await pool.query(searchUserQuery, [ username ]);
    if (searchUserResult.rows[0].deposit < totalPrice) {
        throw new Error("not enough money to buy items");
    }
};

const chargeUser = async (username: string, totalPrice: number) => {
    const updateUserDepositQuery = "UPDATE users SET deposit = deposit - $1 WHERE username = $2";
    const updateUserDepositResult = await pool.query(updateUserDepositQuery, [ Math.floor(totalPrice), username ]);
};

const savePurchaseToHistory = async (username: string, totalPrice: number, userCart: any[]) => {
    const saveWholePurchaseQuery = "INSERT INTO purchases (username, total_amount) VALUES ($1, $2) RETURNING purchase_id";
    const saveWholePurchaseResult = await pool.query(saveWholePurchaseQuery, [ username, totalPrice ]);
    console.log("the purchase is saved to db..");
    console.log("returns:", saveWholePurchaseResult.rows[0]["purchase_id"]);

    const saveSingleItemPurchaseQuery = `INSERT INTO purchase_items (purchase_id, price, item_id, quantity) VALUES (${saveWholePurchaseResult.rows[0]["purchase_id"]}, 1, $1, $2)`;
    for (const item of userCart) {
        const saveSingleItemPurchaseResult = await pool.query(saveSingleItemPurchaseQuery, [ item["item_id"], item.quantity ]);
    };
    console.log("the purchases items are saved to db as well..");
};

const saveCouponUseToHistory = async (username: string, totalDiscount: number, couponID: number) => {
    const addCouponUsageQuery = "INSERT INTO coupon_usage (coupon_id, username, discount_applied) VALUES ($1, $2, $3)";
    const addCouponUsageResult = await pool.query(addCouponUsageQuery, [ couponID, username, totalDiscount ]);

    console.log("coupon used and saved to db..");
}

const clearUserCart = async (username: string) => {
    const clearCartQuery = "DELETE FROM carts WHERE user_name = $1";
    const clearCartResult = await pool.query(clearCartQuery, [ username ]);

    console.log("cart cleared..");
}