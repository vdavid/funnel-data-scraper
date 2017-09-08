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

    let userCounts = await intercomHtmlPage.getSlackCounts(new Date('2017-08-28'), 7);
    logger.log(JSON.stringify(userCounts));

    browser.close();
}

run();