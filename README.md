# Quote Tweet Unnest API

The backend API half of a web tool for unnesting quote tweets.  
**WIP:** Caching and quote skeet unnesting.

- [frontend repo](https://github.com/muskit/qrt-unnester)
- [the site](https://muskit.net/qrt-unnester)

---

`qrt-unnest-api` is a containerized backend server written in JavaScript that's currently ready to deploy on AWS Lambda, as well as Express.js for testing purposes. It is developed with a hybrid architecture in mind, connecting to an on-premise database via Tailscale.

To unnest, it currently uses [Twitter Widgets](https://www.npmjs.com/package/twitter-widgets) to create embeds for viewing on the frontend. It then uses [Puppeteer](https://www.npmjs.com/package/puppeteer-core) to retrieve the nested quote tweets and clean up embeds to be viewed on the frontend.

There are also [scripts](scripts) used for quickly building and pushing to the AWS ECR repo specified in the [.env](.env.example).
