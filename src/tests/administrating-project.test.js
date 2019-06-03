/* eslint-env mocha */
const assert = require('assert')
const puppeteer = require('puppeteer')
const TestHelperBrowser = require('../../test-helper-browser.js')
const testUserData = require('@userappstore/dashboard/test-data.json')
const headless = process.env.SHOW_BROWSERS !== 'true'

describe(`tests/administrating-project`, () => {
  it('should work via UI browsing', async () => {
    global.pageSize = 40
    // create owner account
    const browser1 = await puppeteer.launch({
      headless,
      args: ['--window-size=1440,900', '--window-position=558,155', '--incognito'],
      slowMo: 0
    })
    const ownerPages = await browser1.pages()
    const ownerTab = ownerPages[0]
    await ownerTab.setViewport({ width: 1440, height: 900 })
    await ownerTab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    await ownerTab.waitForSelector('body')
    await TestHelperBrowser.completeForm(ownerTab, {
      username: 'owner-username',
      password: 'owner-password',
      confirm: 'owner-password'
    })
    await ownerTab.waitForSelector('#application-iframe')
    await ownerTab.hover('#administrator-menu-container')
    await ownerTab.waitFor(400)
    await TestHelperBrowser.clickPageLink(ownerTab, 'Dashboard administration')
    await ownerTab.waitForSelector('#application-iframe')
    await TestHelperBrowser.clickPageLink(ownerTab, 'Accounts')
    await ownerTab.waitForSelector('#application-iframe')
    // create developer account
    const browser2 = await puppeteer.launch({
      headless,
      args: ['--window-size=1440,900', '--window-position=2098,155', '--incognito'],
      slowMo: 0
    })
    let developerPages = await browser2.pages()
    let developerTab = developerPages[0]
    await developerTab.setViewport({ width: 1440, height: 900 })
    await developerTab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.completeForm(developerTab, {
      username: 'developer-username',
      password: 'developer-password',
      confirm: 'developer-password'
    })
    await ownerTab.reload()
    // developer shares the project
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickPageLink(developerTab, 'Projects')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickFrameLink(developerTab, 'Create project')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.completeForm(developerTab, {
      projectid: `test-project-${global.testNumber}`
    })
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickPageLink(developerTab, 'Share')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.completeForm(developerTab, {})
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickPageLink(developerTab, 'Home')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickPageLink(developerTab, 'Application servers')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.clickFrameLink(developerTab, 'Administration')
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    await TestHelperBrowser.completeForm(developerTab, {
      email: testUserData[1].email,
      'first-name': testUserData[1].firstName,
      'last-name': testUserData[1].lastName,
    })
    await developerTab.waitForSelector('#application-iframe', { waitLoad: true, waitNetworkIdle: true })
    const pageTitle = await developerTab.title()
    assert.strictEqual(pageTitle, 'Administration')
    browser1.close()
    browser2.close()
  })
})
