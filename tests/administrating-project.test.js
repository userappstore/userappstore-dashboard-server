/* eslint-env mocha */
const assert = require('assert')
const puppeteer = require('puppeteer')
const TestHelper = require('../test-helper.js')
const testUserData = require('@userappstore/dashboard/test-data.json')

// Test that users can administrate their shared projects
// 
// 1) the owner account registers and idles on the accounts page
// 2) a developer account registers and creates a project then 
//    shares it and accesses the administration 

describe.only(`tests/administrating-project`, () => {
  it('should administrate shared project', async () => {
    global.pageSize = 40
    // owner
    const browser1 = await puppeteer.launch(TestHelper.browserConfiguration)
    const ownerPages = await browser1.pages()
    const ownerTab = ownerPages[0]
    await ownerTab.setViewport({ width: 1440, height: 900 })
    await ownerTab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    await ownerTab.waitForSelector('body')
    await TestHelper.completeForm(ownerTab, {
      username: 'owner-username-' + Math.floor(new Date().getTime() / 1000),
      password: 'owner-password',
      confirm: 'owner-password',
      email: 'owner@platform.com',
      'first-name': 'Platform',
      'last-name': 'Owner'
    })
    await TestHelper.hoverItem(ownerTab, 'administrator-menu-container')
    await TestHelper.clickPageLink(ownerTab, 'Dashboard administration')
    await TestHelper.clickPageLink(ownerTab, 'Accounts')
    // developer
    const browser2 = await puppeteer.launch(TestHelper.browserConfiguration)
    const developerUsername = 'developer-username-' + Math.floor(new Date().getTime() / 1000)
    const developerTab = await TestHelper.createRegistration(browser2, {
      username: developerUsername,
      password: 'developer-password',
      confirm: 'developer-password',
      email: 'publisher@account.com',
      'first-name': 'App',
      'last-name': 'Publisher'
    })
    await TestHelper.clickPageLink(developerTab, 'Projects')
    await TestHelper.clickFrameLink(developerTab, 'Create project')
    await TestHelper.completeForm(developerTab, {
      projectid: `test-project-${global.testNumber}`
    })
    await TestHelper.clickPageLink(developerTab, 'Share')
    await TestHelper.completeForm(developerTab, {})
    await TestHelper.clickPageLink(developerTab, 'Home')
    await TestHelper.clickPageLink(developerTab, 'Servers')
    await TestHelper.clickFrameLink(developerTab, 'Administration')
    await TestHelper.completeForm(developerTab, {
      email: testUserData[1].email,
      'first-name': testUserData[1].firstName,
      'last-name': testUserData[1].lastName,
    })
    const administrationFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const pageTitle = await administrationFrame.evaluate(() => {
      return document.getElementsByTagName('h1')[0].innerHTML
    })
    assert.strictEqual(pageTitle, 'Administration')
    browser1.close()
    browser2.close()
  })
})
