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
    const FIRST_DAY_OF_WEEK_TO_SCRAPE = new Date('2017-08-28');

    const browser = await puppeteer.launch({
        headless: false,
    });
    const logger = new Logger();
    const page = await browser.newPage();

    logger.log('Started.');

    const intercomHtmlPage = new IntercomHtmlPage(page, logger);
    await intercomHtmlPage.login(CREDENTIALS);

    try {
        await page.waitForNavigation();
    } catch (e) {
        logger.log('Login didn\'t work.');
    }

    let userCounts = {};
    userCounts = await intercomHtmlPage.getSlackNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, 7);
    userCounts = await intercomHtmlPage.getPaymentFunnelNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, 7);
    userCounts = await intercomHtmlPage.getSubmissionCountRelatedNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, 7);
    logger.log(JSON.stringify(userCounts));

    logger.log('Finished.');

    browser.close();
}

run();