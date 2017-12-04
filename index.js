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
    const FIRST_DAY_OF_WEEK_TO_SCRAPE = new Date('2017-12-04');
    const DAY_COUNT_TO_SCRAPE = 7; /* 7 days are one week :) */

    const browser = await puppeteer.launch({
        headless: true,
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
    userCounts = await intercomHtmlPage.getTrialSignupNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, DAY_COUNT_TO_SCRAPE);
    userCounts = await intercomHtmlPage.getPaymentNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, DAY_COUNT_TO_SCRAPE);
    userCounts = await intercomHtmlPage.getSlackNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, DAY_COUNT_TO_SCRAPE);
    userCounts = await intercomHtmlPage.getSubmissionCountRelatedNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, DAY_COUNT_TO_SCRAPE);
    userCounts = await intercomHtmlPage.getPaymentFunnelNumbers(userCounts, FIRST_DAY_OF_WEEK_TO_SCRAPE, DAY_COUNT_TO_SCRAPE);

    logger.log(JSON.stringify(userCounts));
    logger.log(await convertOutputToCsv(userCounts));
    logger.log('Finished.');

    browser.close();
}

async function convertOutputToCsv(userCounts) {
    const outputArray = [];

    Object.keys(userCounts).forEach(metric => {
        let metricArray = [];
        metricArray.push(metric);

        Object.keys(userCounts[metric]).forEach(locale => {
            Object.keys(userCounts[metric][locale]).forEach(utm => {
                metricArray.push(userCounts[metric][locale][utm]);
            });
            metricArray.push('');
        });
        outputArray.push(metricArray);
    });

    return matrixToCsv(transpose(outputArray));
}

function transpose(matrix) {
    return matrix[0].map((column, columnIndex) => matrix.map((row, rowIndex) => matrix[rowIndex][columnIndex]))
}

function matrixToCsv(matrix) {
    return matrix.map(function (row) {
        return row.join('\t');
    }).join('\n');
}

run();