import { Browser } from "puppeteer-core"

import { getTweetId, removeURLParams, urlValid } from "./utils.js"
import { createBrowser } from "./browser.js"

/**
 * Return HTML of tweet with quoted tweet hidden, and url of quoted tweet
 * @param {string} html The HTMl returned by Twitter's oEmbed for a Tweet.
 * @param {Browser} browser 
 * @returns { { html: string, next_qrt: string } }
 */
async function createCleanEmbed(html, browser) {
    const page = await browser.newPage()
    await page.setContent(html, {
        waitUntil: "networkidle0"
    })

    // get iframe
    let iframeHandle = await page.$("iframe[id=twitter-widget-0]")
    let iframe
    try {
        iframe = await iframeHandle.contentFrame()
    } catch {
        return null
    }

    // work inside iframe
    let nextQRT = await iframe.evaluate(() => {
        let result = document.getElementsByTagName("article")
        let nextQRT

        // FIXME: the quoted tweet isn't always found, leaving nextQRT erroneously unpopulated
        if (result.length >= 2) {
            const qrtElem = result.item(1)
            // get next qrt link
            const qrtSearch = qrtElem.getElementsByTagName('a')
            console.log(`search results: ${qrtSearch.length}`)
            nextQRT = qrtSearch[0].getAttribute("href")

            if (nextQRT == null) {
                console.log(`nextQRT wasn\'t found; leaving page intact`)
            } else {

                // remove quoted tweet from view
                qrtElem.parentElement.remove()
            }
        }
        return nextQRT
    })

    const qrtHTML = await iframe.content()
    await page.close()

    const res = { html: qrtHTML, next_qrt: nextQRT }
    return res

}

/**
 * Returns a Tweet embed with unnested URL in "body".
 * @param {string} url 
 * @param {Browser} browser 
 * @returns {{status: string, body: any}}
 */
async function cleanEmbedAndUnnest(url, browser) {
    // get oEmbed for curTweetURL
    const response = await fetch(`https://publish.twitter.com/oembed?url=${url}&dnt=true&hide_thread=true`)
    if (!response.ok) {
        return { status: "error", body: `From Twitter: ${response.status} ${response.statusText}` }
    }

    const txt = await response.text()
    let json
    try {
        json = JSON.parse(txt)
    } catch (err) {
        return { status: "error", body: `couldn't parse oEmbed JSON: ${err}` }
    }

    // modify embed
    const data = await createCleanEmbed(json.html, browser)
    data.id = getTweetId(url)
    return {
        status: "success",
        body: data
    }
}

export async function* tweetUnnestIterator(url) {
    let visited = new Set()
    let curURL = url

    // TODO: mongo caching

    console.log("launching browser...")
    // ...
    const browser = await createBrowser()
    console.log("browser launched!")
    try {
        while (curURL != null) {
            const data = await cleanEmbedAndUnnest(curURL, browser)
            if (data.status == "success") {
                yield data

                // recursion prevention
                // TODO: TEST
                if (visited.has(data.body.id)) {
                    yield {
                        status: "error",
                        body: "unnested a post that we've already unnested!"
                    }
                    break
                }
                visited.add(data.body.id)
                curURL = data.body.next_qrt
            }
            else {
                // error -- stop
                yield data
                break
            }
        }
    } catch (err) {
        yield {
            "status": "error",
            "body": `While unnesting: ${err}`
        }
        await browser.close()
        return
    }

    await browser.close()
}

// Main data stream. Even handles errors (+ in the URL).
export async function* requestStream(url) {
    if (url == null) {
        yield { "status": "error", "body": "Missing parameter" }
        return
    }

    const err = urlValid(url)
    if (err != null) {
        yield { "status": "error", "body": err }
        return
    }

    // remove URL tracking that interferes with oEmbed API call
    url = removeURLParams(url)

    console.log(`Processing request for ${url}`)

    const tweetIterator = tweetUnnestIterator(url)
    for await (const data of tweetIterator) {
        yield data
    }
}