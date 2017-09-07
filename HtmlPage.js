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
}

module.exports = HtmlPage;