const HtmlPage = require('./HtmlPage');

module.exports = class IntercomHtmlPage extends HtmlPage {
    async login(credentials) {
        const LOGIN_PAGE_URL = 'https://app.intercom.io/admins/sign_in';
        const USERNAME_SELECTOR = '#admin_email';
        const PASSWORD_SELECTOR = '#admin_password';
        const SIGN_IN_BUTTON_SELECTOR = 'button[type=submit] div';

        await this.page.goto(LOGIN_PAGE_URL);

        await this.page.click(USERNAME_SELECTOR);
        await this.page.type(credentials.username);

        await this.page.click(PASSWORD_SELECTOR);
        await this.page.type(credentials.password);

        return this.page.click(SIGN_IN_BUTTON_SELECTOR);
    }

    async getCountForAllLocales() {
        this.logger.log('Loading this.page...');

        this.logger.log('Selecting utm_source...');

        await this.setSimpleFilter('utm_source', 'google');
        await this.setSimpleFilter('utm_medium', 'cpc');
        await this.setSimpleFilter('full_locale_code', 'hu-HU');

        let userCount = await this.getUserCount(this.page);

        this.logger.log(userCount);

        return this.page.screenshot({path: 'screenshots/intercom.png'});
    }

    async setSimpleFilter(filterName, value) {
        const MORE_FILTERS_BUTTON_SELECTOR = '.js__filters-list > a';

        /* Presses "more filters" button if needed */
        try {
            if (!await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"]')) {
                this.logger.log('Filter "' + filterName + '" was not found. Clicking "more"...');
                await this.page.waitForSelector(MORE_FILTERS_BUTTON_SELECTOR);
                await this.page.click(MORE_FILTERS_BUTTON_SELECTOR);
            }
        } catch(e) {
            this.logger.log('"More" button was not found either. That\'s a problem.');
            throw e;
        }

        await this.page.waitForSelector('[data-attribute-name="' + filterName + '"]', {timeout: 0});
        await this.page.click('[data-attribute-name="' + filterName + '"]');
        await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-child(1) input[type="radio"]');
        await this.page.click('[data-attribute-name="' + filterName + '"] + div input[type="text"]');
        return this.page.type(value);
    }

    async getUserCount(comment = "") {
        const USER_COUNT_CONTAINER_SELECTOR = '.t__h1.u__left';
        const USER_COUNT_SELECTOR = 'span.user_count.test__user-company-count';

        /* Waits 3 seconds – it's kind of a random interval but it should work. */
        await this.page.waitFor(3000);

        await this.page.waitForSelector(USER_COUNT_CONTAINER_SELECTOR);

        try {
            let userCountString = await this.page.evaluate((selector) => {
                return document.querySelector(selector).innerHTML;
            }, USER_COUNT_SELECTOR);
            return Number(userCountString.trim().replace(',', ''));
        } catch(e) {
            this.logger.log('Apparently, 3 seconds was not enough. Comment was: ' + comment);
        }
    }
};