const puppeteer = require('puppeteer');
const IntercomHtmlPage = require('./IntercomHtmlPage');

class Logger {
    // noinspection JSMethodCanBeStatic
    log(value) {
        console.log((new Date()).toISOString() + ' ' + value);
    }
}

async function run() {
    const CREDENTIALS = require('./credentials');
    //const segmentNames = ['slack', 'submissions', 'paymentFunnel'];

    const browser = await puppeteer.launch({
        headless: false,
    });
    const logger = new Logger();
    const page = await browser.newPage();

    const intercomHtmlPage = new IntercomHtmlPage(page, logger);
    await intercomHtmlPage.login(CREDENTIALS);

    try {
        await page.waitForNavigation();
    } catch (e) {
        logger.log('Login didn\'t work.');
    }

    await page.goto('https://app.intercom.io/a/apps/sukanddp/users/segments/all-users');

    await intercomHtmlPage.getCountForAllLocales();

//    await page.waitFor(2 * 1000);

    await page.screenshot({path: 'screenshots/github.png'});

    browser.close();
}

run();