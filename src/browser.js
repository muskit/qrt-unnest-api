import puppeteer from "puppeteer-core";
import { isProduction } from "./utils.js";

const MINIMAL_ARGS = [
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-gpu',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
    '--allow-insecure-localhost',
];

export async function createBrowser() {
    const startTime = performance.now()
    const browser = await puppeteer.launch({
        // executablePath: "/usr/bin/chromium",
        executablePath: process.env.BROWSER_PATH,
        args: MINIMAL_ARGS,
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        headless: isProduction(),
        timeout: 61_000,
        dumpio: true,
    })
    console.log(`browser launched after ${(performance.now() - startTime) / 1000} seconds`)
    return browser
}