/**
 * For use in an AWS Lambda function deployment.
 */
"use strict";

import { requestStream } from "./stream.js";

// HACK: force flush of data chunk
// https://betterdev.blog/lambda-response-streaming-flush-content/
const padding = " ".repeat(100_000); // generate 100 KB string

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
    // console.log(`event: ${JSON.stringify(event)}`)

    responseStream.setContentType("text/plain")

    let url
    if ("body" in event) {
        // URL invocation
        const body = JSON.parse(event.body)
        url = body.url
    } else {
        // direct invocation
        url = event.url
    }

    for await (const chunk of requestStream(url)) {
        responseStream.write(chunk + "\n")
    }
    responseStream.end()
})
