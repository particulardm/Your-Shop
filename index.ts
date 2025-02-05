import express, {Request, Response } from "express"

const app = express();
const PORT = 3000;

app.get('/', () => {
    console.log(`hello there`);
});

app.listen(PORT, () => {
    console.log(`listening on `, PORT);
})

