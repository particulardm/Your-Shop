import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken";

export const checkToken = function (req: Request, res: Response, next: NextFunction) {
    // console.log(req.headers);
    const auth = req.headers.authorization;

    if (auth) {
        const token = auth.split(' ').length > 1 ? auth.split(' ')[1] : auth;
        const secretKey = process.env.SECRET_KEY as string;
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.error(err.message);
                res.status(400).json({
                    message: "Please provide a valid token"
                })
            }
            else {
                if (typeof decoded === "string" || typeof decoded === "undefined") {
                    res.status(400).json({
                        message: "Please provide a valid token"
                    });
                    return;
                }

                console.log("decoded token:", decoded, typeof decoded);
                req.user = decoded;
                next();
            }
        });
    }
    else {
        res.status(400).json({
            message: "Please provide a token"
        }) 
    }
}

