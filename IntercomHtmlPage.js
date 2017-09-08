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

    async getSlackNumbers(firstDateToInclude, numberOfDaysToInclude) {
        await this.page.goto('https://app.intercom.io/a/apps/sukanddp/users/segments/all-users');

        await this.setDateFilter('arrived_to_slack', firstDateToInclude, numberOfDaysToInclude);

        return await this.getNumbersForAllLocaleAndUtmSettings('slack');
    }

    async getPaymentFunnelNumbers(firstDateToInclude, numberOfDaysToInclude) {
        await this.page.goto('https://app.intercom.io/a/apps/sukanddp/users/segments/all-users');

        await this.setDateFilter('payment_invoicing_data_submitted', firstDateToInclude, numberOfDaysToInclude);

        return await this.getNumbersForAllLocaleAndUtmSettings('payment');
    }

    async getSubmissionCountRelatedNumbers(firstDateToInclude, numberOfDaysToInclude) {
        const SUBMISSION_COUNT_FILTER_VALUES = [0]; // TODO: , 4, 14];

        await this.page.goto('https://app.intercom.io/a/apps/sukanddp/users/segments/all-users');

        await this.setDateFilter('Signed up', firstDateToInclude, numberOfDaysToInclude);

        let userCounts = {};

        for (let i = 0; i < SUBMISSION_COUNT_FILTER_VALUES.length; i++) {
            let submissionCount = SUBMISSION_COUNT_FILTER_VALUES[i];
            await this.setSimpleFilter('total_submission_count', submissionCount);

            userCounts = Object.assign(userCounts, await this.getNumbersForAllLocaleAndUtmSettings('submissions=' + submissionCount));
        }

        return userCounts;
    }

    async getNumbersForAllLocaleAndUtmSettings(comment) {
        const LOCALE_FILTERS = ['hu-HU', 'pl-PL', 'ro-RO', 'tr-TR'];
        const LOCALE_AND_UTM_FILTERS = [
            {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpc'},
            {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpc-remarketing'},
            // {locale: 'hu-HU', utmSource: 'google', utmMedium: 'cpm-ismertsegfelepito'},
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

        /* Collects blended numbers for each locale */
        for (let i = 0; i < LOCALE_FILTERS.length; i++) {
            let locale = LOCALE_FILTERS[i];
            let key = comment + " " + locale + ' blended';
            await this.setSimpleFilter('full_locale_code', locale);
            userCounts[key] = await this.getUserCount(key);
        }

        /* Collects UTM-specific data */
        for (let i = 0; i < LOCALE_AND_UTM_FILTERS.length; i++) {
            let filter = LOCALE_AND_UTM_FILTERS[i];
            let key = comment + " " + filter.locale + ' ' + filter.utmSource + ' ' + filter.utmMedium;
            await this.setSimpleFilter('utm_source', filter.utmSource);
            await this.setSimpleFilter('utm_medium', filter.utmMedium);
            await this.setSimpleFilter('full_locale_code', filter.locale);
            userCounts[key] = await this.getUserCount(key);
        }

        return userCounts;
    }

    async setSimpleFilter(filterName, value) {
        await this.pressMoreFiltersButtonIfNeeded(filterName);

        if (!await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"] + div input[type="text"]')) {
            await this.page.click('[data-attribute-name="' + filterName + '"]');
            await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-child(1) input[type="radio"]');
        }
        await this.page.click('[data-attribute-name="' + filterName + '"] + div input.f__text');

        /* Selects all text */
        await this.page.keyboard.down('Control');
        await this.page.press('a');
        await this.page.keyboard.up('Control');

        return this.page.type(value.toString());
    }

    /**
     *
     * @param {string} filterName
     * @param {Date} firstDateToInclude
     * @param {Number} numberOfDaysToInclude
     * @returns {Promise.<void>}
     */
    async setDateFilter(filterName, firstDateToInclude, numberOfDaysToInclude) {
        let lowerBoundDate = new Date(firstDateToInclude.getTime() - 24 * 60 * 60 * 1000);
        let upperBoundDate = new Date(firstDateToInclude.getTime() + numberOfDaysToInclude * 24 * 60 * 60 * 1000);
        let lowerDateFilterComponents = IntercomHtmlPage.convertDateToComponents(lowerBoundDate);
        let upperDateFilterComponents = IntercomHtmlPage.convertDateToComponents(upperBoundDate);
        //this.logger.log(JSON.stringify(lowerDateFilterComponents));
        //this.logger.log(JSON.stringify(upperDateFilterComponents));

        await this.pressMoreFiltersButtonIfNeeded(filterName);

        /* Opens filter if needed */
        let filterHasCheckboxes = false;
        let filterWasClosed = !await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"] + div select');
        if (filterWasClosed) {
            this.logger.log('Opening filter ' + filterName + '...');
            await this.page.click('[data-attribute-name="' + filterName + '"]');
            filterHasCheckboxes = await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(2) input[type="checkbox"]');
            if (filterHasCheckboxes) {
                await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(2) input[type="checkbox"]');
            }
            /* Opens second part of the filter too */
            await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(4)');
            if (filterHasCheckboxes) {
                await this.page.click('[data-attribute-name="' + filterName + '"] + div button');
            } else {
                await this.page.click('[data-attribute-name="' + filterName + '"] + div + span button');
            }
        } else {
            filterHasCheckboxes = await this.doesPageContainSelector('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(2) input[type="checkbox"]');
        }
        this.logger.log('Has checkboxes: ' + (filterHasCheckboxes ? 'yes' : 'no'));

        /* Lower bound*/
        await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(4)');
        await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(4) + div select:nth-child(1)');
        await this.page.type(lowerDateFilterComponents.month);
        await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(4) + div select:nth-of-type(2)');
        await this.page.type(lowerDateFilterComponents.day.toString());
        await this.page.click('[data-attribute-name="' + filterName + '"] + div label:nth-of-type(4) + div select:nth-child(3)');
        await this.page.type(lowerDateFilterComponents.year.toString());
        await this.page.press("Tab");

        /* Upper bound */
        let upperBoundContainerSelector = '[data-attribute-name="' + filterName + '"] + div '
            + (filterHasCheckboxes ? '> div > div:nth-of-type(3)' : '+ div')
        + ' label:nth-of-type(6)';
        await this.page.click(upperBoundContainerSelector);
        if (!filterHasCheckboxes) {
            upperBoundContainerSelector = '[data-attribute-name="' + filterName + '"] + div + div + div label:nth-of-type(6)';
        }
        await this.page.click(upperBoundContainerSelector + ' + div select:nth-child(1)');
        await this.page.type(upperDateFilterComponents.month);
        await this.page.click(upperBoundContainerSelector + ' + div select:nth-child(2)');
        await this.page.type(upperDateFilterComponents.day.toString());
        await this.page.click(upperBoundContainerSelector + ' + div select:nth-child(3)');
        await this.page.type(upperDateFilterComponents.year.toString());
        await this.page.press("Tab");
    }

    async pressMoreFiltersButtonIfNeeded(filterName) {
        const MORE_FILTERS_BUTTON_SELECTOR = '.js__filters-list > a';

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


    static convertDateToComponents(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return {
            year: date.getFullYear(),
            month: months[date.getMonth()],
            day: date.getDate()
        };
    }
}

module.exports = IntercomHtmlPage;