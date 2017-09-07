const puppeteer = require('puppeteer');

async function run() {
    const CREDENTIALS = require('./credentials');
    //const segmentNames = ['slack', 'submissions', 'paymentFunnel'];

    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    await loginToIntercom(page, CREDENTIALS);

    try {
        await page.waitForNavigation();
    } catch (e) {
        console.log('Login didn\'t work.');
    }

    await page.goto('https://app.intercom.io/a/apps/sukanddp/users/segments/all-users');

    await getCountForAllLocales(page);

//    await page.waitFor(2 * 1000);

    await page.screenshot({path: 'screenshots/github.png'});

    browser.close();
}

async function loginToIntercom(page, credentials) {
    const LOGIN_PAGE_URL = 'https://app.intercom.io/admins/sign_in';
    const USERNAME_SELECTOR = '#admin_email';
    const PASSWORD_SELECTOR = '#admin_password';
    const SIGN_IN_BUTTON_SELECTOR = 'button[type=submit] div';

    await page.goto(LOGIN_PAGE_URL);

    await page.click(USERNAME_SELECTOR);
    await page.type(credentials.username);

    await page.click(PASSWORD_SELECTOR);
    await page.type(credentials.password);

    return page.click(SIGN_IN_BUTTON_SELECTOR);
}

async function getCountForAllLocales(page) {
    log('Loading page...');

    log('Selecting utm_source...');

    await setFilter(page, 'utm_source', 'google');

    let userCount = await getUserCount(page);

    console.log(userCount);

    return page.screenshot({path: 'screenshots/intercom.png'});
}

async function setFilter(page, filterName, value) {
    const MORE_FILTERS_BUTTON_SELECTOR = '.js__filters-list > a';

    /* Presses "more filters" button if needed */
    try {
        await page.waitForSelector('[data-attribute-name="' + filterName + '"]', {timeout: 1});
    } catch(e) {
        log('Last filter was not found.');
        await page.waitForSelector(MORE_FILTERS_BUTTON_SELECTOR);
        await page.click(MORE_FILTERS_BUTTON_SELECTOR);
    }

    await page.waitForSelector('[data-attribute-name="' + filterName + '"]', {timeout: 0});
    await page.click('[data-attribute-name="' + filterName + '"]');
    await page.click('[data-attribute-name="' + filterName + '"] + div label:nth-child(1) input[type="radio"]');
    await page.click('[data-attribute-name="' + filterName + '"] + div input[type="text"]');
    return page.type(value);
}

async function getUserCount(page) {
    const USER_COUNT_SELECTOR = 'span.user_count.test__user-company-count';

    await page.waitFor(3000);
    await page.waitForSelector(USER_COUNT_SELECTOR);

    let userCountString = await page.evaluate((selector) => {
        return document.querySelector(selector).innerHTML;
    }, USER_COUNT_SELECTOR);
    return Number(userCountString.trim().replace(',', ''));
}

function log(value) {
    console.log((new Date()).toISOString() + ' ' + value);
}

run();