Funnel Data Scraper
===================
- by David Veszelovszki
- for CodeBerry
- v1 created on: 2017-09-07 - 2017-09-08


What it does
------------

This project scrapes Intercom and collects the data we need on our Monday meetings.

Running
-------
Needs Node 8.x to run. Uses async/await. No Babel or other tools needed, just Node, NPM and optionally yarn.

Probably won't even handle minor Intercom design changes, because it's very closely tied to the HTML structure.

Set the date in the `index.js/FIRST_DAY_OF_WEEK_TO_SCRAPE` constant.

It you need a new locale or new UTM sources/mediums, add them to the `IntercomHtmlPage/getNumbersForAllLocaleAndUtmSettings()` function constants.

If submission counts change, change the constant in the `IntercomHtmlPage/getSubmissionCountRelatedNumbers()` function.

Needs about 6 minutes to run for 4 locales.

Outputs data to the standard output in JSON and CSV.

