const HtmlPage = require('./HtmlPage');

class IntercomHtmlPage extends HtmlPage {
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
        const LOCALE_AND_UTM_FILTERS = [
            {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpc'},
            {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpc-remarketing'},
            {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpm-ismertsegfelepito'},
            // {locale: 'hu-HU', utmSource: 'facebook', utmMedium: 'cpc-remarketing'},
            // {locale: 'pl-PL', utmSource: 'google', utmMedium: 'cpc'},
            // {locale: 'pl-PL', utmSource: 'google', utmMedium: 'cpc-remarketing'},
            // {locale: 'pl-PL', utmSource: 'facebook', utmMedium: 'cpc-remarketing'},
            // {locale: 'ro-RO', utmSource: 'google', utmMedium: 'cpc'},
            // {locale: 'ro-RO', utmSource: 'google', utmMedium: 'cpc-remarketing'},
            // {locale: 'ro-RO', utmSource: 'facebook', utmMedium: 'cpc-remarketing'},
            // {locale: 'tr-TR', utmSource: 'google', utmMedium: 'cpc'},
            // {locale: 'tr-TR', utmSource: 'google', utmMedium: 'cpc-remarketing'},
            // {locale: 'tr-TR', utmSource: 'facebook', utmMedium: 'cpc-remarketing'},
        ];

        let userCounts = {};

        for (let i = 0; i < LOCALE_AND_UTM_FILTERS.length; i++) {
            let filter = LOCALE_AND_UTM_FILTERS[i];
            await this.setSimpleFilter('utm_source', filter.utmSource);
            await this.setSimpleFilter('utm_medium', filter.utmMedium);
            await this.setSimpleFilter('full_locale_code', filter.locale);
            let userCount = await this.getUserCount(filter.locale + ' ' + filter.utmSource + ' ' + filter.utmMedium);
            this.logger.log(userCount); // TODO: Only for testing. Remove.
            userCounts[filter.locale + ' ' + filter.utmSource + ' ' + filter.utmMedium] = userCount;
        }

        this.logger.log(userCounts.toString());

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
        } catch (e) {
            this.logger.log('"More" button was not found either. That\'s a problem.');
            throw e;
        }

        if (!await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"] + div input[type="text"]')) {
            await this.page.waitForSelector('[data-attribute-name="' + filterName + '"]', {timeout: 0});
            await this.page.click('[data-attribute-name="' + filterName + '"]');
            await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-child(1) input[type="radio"]');
        }
        await this.page.click('[data-attribute-name="' + filterName + '"] + div input[type="text"]');

        /* Selects all text */
        this.page.keyboard.down('Control');
        this.page.press('a');
        this.page.keyboard.up('Control');

        return this.page.type(value);
    }

    async getUserCount(comment = "") {
        const USER_COUNT_CONTAINER_SELECTOR = '.t__h1.u__left';
        const USER_COUNT_SELECTOR = 'span.user_count.test__user-company-count';

        /* Waits 3 seconds – it's kind of a random interval but it should work. */
        await this.page.waitFor(3000);

        await this.page.waitForSelector(USER_COUNT_CONTAINER_SELECTOR);

        try {
            let userCountString = await this.getInnerHtmlBySelector(USER_COUNT_SELECTOR);
            return Number(userCountString.trim().replace(',', ''));
        } catch (e) {
            if (await this.doesPageContainSelector(USER_COUNT_CONTAINER_SELECTOR)
                && !await this.doesPageContainSelector(USER_COUNT_SELECTOR)) {
                return 0;
            } else {
                this.logger.log('Apparently, 3 seconds was not enough. Comment was: ' + comment);
                throw e;
            }
        }
    }
}

module.exports = IntercomHtmlPage;