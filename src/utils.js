export function iteratorToStream(iterator) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next()

            if (done) {
                controller.close()
            } else {
                controller.enqueue(value)
            }
        },
    })
}

export function getTweetId(urlStr) {
    const url = new URL(urlStr)
    let split = url.pathname.split("/");
    return split[3];
}

export function removeURLParams(url) {
    const urlTmp = new URL(url)
    urlTmp.search = ""
    return urlTmp.href
}

export function urlValid(url) {
    try {
        url = new URL(url);

        if (!["http:", "https:"].includes(url.protocol)) {
            return "URL is not a web link!"
        }
        if (
            // TODO: bsky.app
            !["twitter.com", "x.com"].includes(url.hostname.replace("www.", ""))
        ) {
            return "URL is not Twitter/X!"
        }

        let split = url.pathname.split("/");
        try {
            if (split[2] != "status")
                return "URL is not of a post!"
            Number(split[3])
        } catch (_) {
            return "URL is not of a post!"
        }
    } catch (ex) {
        return "Input is not a URL!"
    }
    return null
}