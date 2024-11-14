import { Browser } from "puppeteer-core"

import { getTweetId, isProduction, removeURLParams, urlValid } from "./utils.js"
import { createBrowser } from "./browser.js"
import { config as dotenvLoad } from "dotenv"

dotenvLoad({ path: '.env.prod' })

/**
 * Return HTML of tweet with quoted tweet hidden, and url of quoted tweet
 * @param {string} html The HTMl returned by Twitter's oEmbed for a Tweet.
 * @param {Browser} browser 
 * @returns { { html: string, next_qrt: string } }
 */
async function cleanEmbed(html, browser) {
    const page = await browser.newPage()
    // await page.setCookie(
    //     {
    //         domain: "x.com",
    //         name: "auth_token",
    //         value: process.env.X_AUTH_TOKEN,
    //         path: '/',
    //         expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    //     }
    // )
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
    let nextQRT = await iframe.evaluate((is_production) => {
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
                console.log("nextQRT found; removing element...")
                if (is_production)
                    // remove quoted tweet from view
                    qrtElem.parentElement.remove()
            }
        }
        return nextQRT
    }, isProduction())

    const qrtHTML = await iframe.content()
    if (isProduction())
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
async function getEmbedAndUnnest(url, browser) {
    // get oEmbed for curTweetURL
    const response = await fetch(
        `https://publish.twitter.com/oembed?url=${url}&dnt=true&hide_thread=true`,
        {
            headers: {
                cookie: `auth_token=${process.env.X_AUTH_TOKEN}`
            }
        }
    )
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
    const data = await cleanEmbed(json.html, browser)
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

    const browser = await createBrowser()
    console.log("browser launched!")
    try {
        while (curURL != null) {
            console.log(`unnesting ${curURL}...`)
            const data = await getEmbedAndUnnest(curURL, browser)
            if (data.status == "success") {
                yield data

                // recursion prevention
                // TODO: TEST
                if (visited.has(data.body.id)) {
                    console.log("ran into repeated post!")
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
                console.log(`data error!\n${data}`)
                // error -- stop
                yield data
                break
            }
        }
    } catch (err) {
        console.log(`unknown error while unnesting!!!\n${err}`)
        yield {
            "status": "error",
            "body": `While unnesting: ${err}`
        }
        await browser.close()
        return
    }

    console.log("finished unnesting")
    if (isProduction())
        await browser.close()
}
