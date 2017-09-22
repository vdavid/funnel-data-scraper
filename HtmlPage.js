class HtmlPage {
    constructor(page, logger) {
        this.page = page;
        this.logger = logger;
    }

    async doesPageContainSelector(selector) {
        return await this.getElementCountBySelector(selector) > 0;
    }

    async getElementCountBySelector(selector) {
        return await this.page.evaluate((selector) => {
            return document.querySelectorAll(selector).length;
        }, selector);
    }

    async getInnerHtmlBySelector(selector) {
        return await this.page.evaluate((selector) => {
            return document.querySelector(selector).innerHTML;
        }, selector);
    }

    // async setFieldValue(selector, value) {
    //     this.page.evaluate((selector, value) => {
    //         return document.querySelector(selector).value = value;
    //     }, selector, value)
    // }
    //
    async getFieldValue(selector) {
        return this.page.evaluate((selector) => {
            return document.querySelector(selector).value;
        }, selector)
    }
}

module.exports = HtmlPage;