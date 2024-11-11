import express from "express";

import { requestStream } from "./tweet_unnest.js";

const app = express();

app.get("/", async (req, res, next) => {
    // check for param "url"
    const url = req.query.url
    if (!url) {
        res.status(400).json({ "message": "Missing parameter" })
        return
    }


    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
    })

    const stream = requestStream(url)

    // stream
    for await (const post of stream) {
        res.write(post)
    }

    res.end()
    // next()
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
});