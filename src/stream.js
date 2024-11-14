import { tweetUnnestIterator } from "./tweet_unnest.js"
import { urlValid, removeURLParams, isProduction } from "./utils.js"

// Main data stream. Even handles errors (+ in the URL).
export async function* requestStream(url) {
    if (isProduction()) {
        console.log("Running in production mode!")
    } else {
        console.log("Running in dev mode!")
    }

    if (url == null) {
        yield JSON.stringify({ "status": "error", "body": "Missing parameter" })
        return
    }

    const err = urlValid(url)
    if (err != null) {
        yield JSON.stringify({ "status": "error", "body": err })
        return
    }

    // remove URL tracking that interferes with oEmbed API call
    url = removeURLParams(url)

    console.log(`Processing request for ${url}`)

    const tweetIterator = tweetUnnestIterator(url)
    for await (const data of tweetIterator) {
        yield JSON.stringify(data)
    }
}