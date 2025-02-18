import { connectDB, disconnectDB, pool } from "../../db/client";
import { Request, Response } from "express";

// это не единственные поля, которые будут в присылаемом объекте, но их там много. 
// пока что буду просто экстендить этот интерфейс в дженерике
interface Item {
    price: string;
    category: string;
}



export const getAllItems = async function (req: Request, res: Response) {
    // console.log("user for get all items:", req.user);
    try {
        await connectDB();
        const allItemsQuery = "SELECT * FROM items";
        const allItems = await pool.query(allItemsQuery);
        res.status(200).json({
            items: allItems.rows
        })
        
    } catch (err) {
        res.status(400).json({
            error: err
        })
        console.error(err);
    } 
}

// здесь сделал через повторный запрос к дб, но раз уж я предположил, что клиент будет присылать эти данные с реквестом, лучше будет унифицировать
export const searchForSingleItem = async function (itemName: string) {
    try {
        await connectDB();
        const query = "SELECT * FROM items WHERE name ILIKE $1";
        const foundItems = await pool.query(query, [`%${itemName}%`]);
        // console.log(foundItems.rows);
        return foundItems.rows
    } catch (err) {
        console.error(err);
        throw err;
    } 
}



// пока не создаю полноценный интерфейс, потому что меня будет интересовать одно конкретное поле. 
// собственно, суть в том, что первым параметром функция принимает массив объектов, у которых будет поле price
const sortItemsByPrice = function<T extends Item>(items: T[], cheaperFirst: boolean = true) {
    const onlyElementsWithPrice = items.filter( (item) => {
        return item.price !== undefined;
    })

    if (cheaperFirst) {
        onlyElementsWithPrice.sort( (a,b) => {
            const parsedA = parseFloat(a.price);
            const parsedB = parseFloat(b.price);
            return parsedA - parsedB;
        })
    }
    else {
        onlyElementsWithPrice.sort( (a,b) => {
            const parsedA = parseFloat(a.price);
            const parsedB = parseFloat(b.price);
            return parsedB - parsedA;
        })
    }

    // console.log(onlyElementsWithPrice);
    return onlyElementsWithPrice;
}

const sortItemsByCategory = function<T extends Item>(items: T[], category: string) {
    const onlyElementsWithCategory = items.filter( (item) => {
        return item.category !== undefined;
    })

    onlyElementsWithCategory.sort( (a,b) => {
        if (a.category.toLowerCase() === category.toLowerCase() && b.category.toLowerCase() !== category.toLowerCase()) {
            return -1;
        }

        if (a.category.toLowerCase() !== category.toLowerCase() && b.category.toLowerCase() === category.toLowerCase()) {
            return 1;
        }

        return a.category.localeCompare(b.category);
    })

    console.log(onlyElementsWithCategory);
}

export const sortItems = async function (req: Request, res: Response) {
    // ?type=byPrice&ascending=true  || ?type=byCategory&category=Electronics
    const query = req.query;
    console.log("query:", query);
    const { items } = req.body;
    // console.log("items received for sorting:", items);
    const typeOfSort = query.type === "byCategory" ? "byCategory" : "byPrice";

    let result;

    // такая имлпементация работает, пока у меня предусмотрено мало опций для сортировки, да и то коряво;
    if (typeOfSort === "byPrice") {
        const ascending = query.ascending === "false" ? false : true;
        result = sortItemsByPrice(items, ascending);
        console.log("result for byprice:", result);
    }
    else {
        let categoryType;

        // вот этот изврат приходится делать, потому что query.type может возвращать не только строки, но и ParsedQS??
        if (typeof categoryType !== undefined) {
            categoryType = String(query.category);
        }
        else categoryType = "Electronics";
        result = sortItemsByCategory(items, categoryType);
        console.log("result for bycategory:", result);
    }

    res.status(200).json({
        sorted: result
    });
}
