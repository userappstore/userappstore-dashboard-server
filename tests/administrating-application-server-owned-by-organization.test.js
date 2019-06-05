/* eslint-env mocha */
const assert = require('assert')
const puppeteer = require('puppeteer')
const TestHelperBrowser = require('../test-helper-browser.js')
const testUserData = require('@userappstore/dashboard/test-data.json')

// 1) the owner account registers and idles on the accounts page
// 2) a developer account registers, creates an organization, and claims
//    an application server owned by that organization, then idles on
//    the server administration home
// 3) another developer registers, joins the organization, then idles
//    on the server administration home

describe.only(`tests/administrating-application-server-owned-by-organization`, () => {
  it('should work with browser JS enabled', async () => {
    global.pageSize = 40
    // owner
    const browser1 = await puppeteer.launch(TestHelperBrowser.browserConfiguration)
    const ownerUsername = 'owner-username-' + Math.floor(new Date().getTime() / 1000)
    const ownerTab = await TestHelperBrowser.createOwner(browser1, {
      username: ownerUsername,
      password: 'owner-password',
      confirm: 'owner-password',
      email: 'owner@platform.com',
      'first-name': 'Platform',
      'last-name': 'Owner'
    })
    await TestHelperBrowser.hoverItem(ownerTab, 'administrator-menu-container')
    await TestHelperBrowser.clickPageLink(ownerTab, 'Dashboard administration')
    await TestHelperBrowser.clickPageLink(ownerTab, 'Accounts')
    // developer
    const browser2 = await puppeteer.launch(TestHelperBrowser.browserConfiguration)
    const developerUsername = 'developer-username-' + Math.floor(new Date().getTime() / 1000)
    const developerTab = await createRegistration(browser2, {
      username: developerUsername,
      password: 'developer-password',
      confirm: 'developer-password',
      email: 'publisher@account.com',
      'first-name': 'App',
      'last-name': 'Publisher'
    })
    await TestHelperBrowser.hoverItem(developerTab, 'account-menu-container')
    await TestHelperBrowser.clickPageLink(developerTab, 'Manage organizations')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Create organization')
    await TestHelperBrowser.completeForm(developerTab, {
      name: 'My organization',
      email: testUserData[2].email
    })
    await TestHelperBrowser.completeForm(developerTab, {
      username: developerUsername,
      password: 'developer-password',
      'remember-minutes': ''
    })
    await TestHelperBrowser.clickPageLink(developerTab, 'Invitations')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Create invitation')
    await TestHelperBrowser.completeForm(developerTab, {
      code: 'the-invitation-code'
    })
    const invitationLinkFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const invitationid = await invitationLinkFrame.$eval('.link', e => e.value)
    await TestHelperBrowser.clickPageLink(developerTab, 'Home')
    await TestHelperBrowser.clickPageLink(developerTab, 'Servers')
    await TestHelperBrowser.clickPageLink(developerTab, 'Claim domain')
    await TestHelperBrowser.completeForm(developerTab, {
      url: 'https://test-application.server7373.synology.me',
      organizationid: 'My organization'
    }, '#submit-url-button')
    let verificationText
    while(!verificationText) {
      await developerTab.waitFor(100)
      try {
        const verificationFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
        verificationText = await verificationFrame.$eval('#token', e => e.value)
      } catch (error) {
      }
    }
    const testServer = require('http').createServer((_, res) => {
      res.statusCode = 200
      return res.end(verificationText)
    }).listen(8300, '0.0.0.0')
    await developerTab.waitFor(1000)
    await TestHelperBrowser.completeForm(developerTab, {}, '#submit-claim-button')
    testServer.close()
    await TestHelperBrowser.clickPageLink(developerTab, 'Home')
    await TestHelperBrowser.clickPageLink(developerTab, 'Servers')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Administration')
    await TestHelperBrowser.completeForm(developerTab, {
      email: testUserData[1].email,
      'first-name': testUserData[1].firstName,
      'last-name': testUserData[1].lastName,
    })
    // second developer
    const browser3 = await puppeteer.launch(TestHelperBrowser.browserConfiguration)
    const developerUsername2 = 'second-developer-username-' + Math.floor(new Date().getTime() / 1000)
    const developer2Tab = await TestHelperBrowser.createRegistration(browser3, {
      username: developerUsername2,
      password: 'developer2-password',
      confirm: 'developer2-password',
      email: 'other@developer.com',
      'first-name': 'Second',
      'last-name': 'Developer'
    })
    await TestHelperBrowser.hoverItem(developer2Tab, 'account-menu-container')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Manage organizations')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Accept invitation')
    await TestHelperBrowser.completeForm(developer2Tab, {
      invitationid,
      name: `${testUserData[3].firstName} ${testUserData[3].lastName}`,
      email: testUserData[3].email,
      code: 'the-invitation-code'
    })
    await TestHelperBrowser.completeForm(developer2Tab, {
      username: developerUsername2,
      password: 'developer2-password',
      'remember-minutes': ''
    })
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Home')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Servers')
    await TestHelperBrowser.clickFrameLink(developer2Tab, 'Administration')
    await TestHelperBrowser.completeForm(developer2Tab, {
      email: testUserData[3].email,
      'first-name': testUserData[3].firstName,
      'last-name': testUserData[3].lastName,
    })
    const administrationFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const pageTitle = await administrationFrame.evaluate(() => {
      return document.getElementsByTagName('h1')[0].innerHTML
    })
    assert.strictEqual(pageTitle, 'Administration')
    browser1.close()
    browser2.close()
    browser3.close()
  })

  it('should work with browser JS disabled', async () => {
    global.pageSize = 40
    // owner
    const browser1 = await puppeteer.launch({
      headless,
      args: ['--window-size=1440,900', '--window-position=558,155', '--incognito'],
      slowMo: 0
    })
    const ownerPages = await browser1.pages()
    const ownerTab = ownerPages[0]
    await ownerTab.setJavaScriptEnabled(false)
    await ownerTab.setViewport({ width: 1440, height: 900 })
    await ownerTab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    await ownerTab.waitForSelector('body')
    const ownerUsername = 'owner-username-' + Math.floor(new Date().getTime() / 1000)
    await TestHelperBrowser.completeForm(ownerTab, {
      username: ownerUsername,
      password: 'owner-password',
      confirm: 'owner-password',
      email: 'owner@platform.com',
      'first-name': 'Platform',
      'last-name': 'Owner'
    })
    await TestHelperBrowser.hoverItem(ownerTab, 'administrator-menu-container')
    await TestHelperBrowser.clickPageLink(ownerTab, 'Dashboard administration')
    await TestHelperBrowser.clickPageLink(ownerTab, 'Accounts')
    // developer
    const browser2 = await puppeteer.launch({
      headless,
      args: ['--window-size=1440,900', '--window-position=2098,155', '--incognito'],
      slowMo: 0
    })
    let developerPages = await browser2.pages()
    let developerTab = developerPages[0]
    await developerTab.setJavaScriptEnabled(false)
    await developerTab.setViewport({ width: 1440, height: 900 })
    await developerTab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    const developerUsername = 'developer-username-' + Math.floor(new Date().getTime() / 1000)
    await TestHelperBrowser.completeForm(developerTab, {
      username: developerUsername,
      password: 'developer-password',
      confirm: 'developer-password',
      email: 'publisher@account.com',
      'first-name': 'App',
      'last-name': 'Publisher'
    })
    await TestHelperBrowser.hoverItem(developerTab, 'account-menu-container')
    await TestHelperBrowser.clickPageLink(developerTab, 'Manage organizations')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Create organization')
    await TestHelperBrowser.completeForm(developerTab, {
      name: 'My organization',
      email: testUserData[2].email
    })
    await TestHelperBrowser.completeForm(developerTab, {
      username: developerUsername,
      password: 'developer-password',
      'remember-minutes': ''
    })
    await TestHelperBrowser.clickPageLink(developerTab, 'Invitations')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Create invitation')
    await TestHelperBrowser.completeForm(developerTab, {
      code: 'the-invitation-code'
    })
    const invitationLinkFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const invitationid = await invitationLinkFrame.$eval('.link', e => e.value)
    await TestHelperBrowser.clickPageLink(developerTab, 'Home')
    await TestHelperBrowser.clickPageLink(developerTab, 'Servers')
    await TestHelperBrowser.clickPageLink(developerTab, 'Claim domain')
    await TestHelperBrowser.completeForm(developerTab, {
      url: 'https://test-application.server7373.synology.me',
      organizationid: 'My organization'
    }, '#submit-url-button')
    let verificationText
    while (!verificationText) {
      await developerTab.waitFor(100)
      try {
        const verificationFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
        verificationText = await verificationFrame.$eval('#token', e => e.value)
      } catch (error) {
      }
    }
    const testServer = require('http').createServer((_, res) => {
      res.statusCode = 200
      return res.end(verificationText)
    }).listen(8300, '0.0.0.0')
    await developerTab.waitFor(1000)
    await TestHelperBrowser.completeForm(developerTab, {}, '#submit-claim-button')
    testServer.close()
    await TestHelperBrowser.clickPageLink(developerTab, 'Home')
    await TestHelperBrowser.clickPageLink(developerTab, 'Servers')
    await TestHelperBrowser.clickFrameLink(developerTab, 'Administration')
    await TestHelperBrowser.completeForm(developerTab, {
      email: testUserData[1].email,
      'first-name': testUserData[1].firstName,
      'last-name': testUserData[1].lastName,
    })
    // second developer
    const browser3 = await puppeteer.launch({
      headless,
      args: ['--window-size=1440,900', '--window-position=2098,1105', '--incognito'],
      slowMo: 0
    })
    const browser3Pages = await browser3.pages()
    const developer2Tab = browser3Pages[0]
    await developer2Tab.setJavaScriptEnabled(false)
    await developer2Tab.setViewport({ width: 1440, height: 900 })
    await developer2Tab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
    const developerUsername2 = 'second-developer-username-' + Math.floor(new Date().getTime() / 1000)
    await TestHelperBrowser.completeForm(developer2Tab, {
      username: developerUsername2,
      password: 'developer2-password',
      confirm: 'developer2-password',
      email: 'other@developer.com',
      'first-name': 'Second',
      'last-name': 'Developer'
    })
    await TestHelperBrowser.hoverItem(developer2Tab, 'account-menu-container')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Manage organizations')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Accept invitation')
    await TestHelperBrowser.completeForm(developer2Tab, {
      invitationid,
      name: `${testUserData[3].firstName} ${testUserData[3].lastName}`,
      email: testUserData[3].email,
      code: 'the-invitation-code'
    })
    await TestHelperBrowser.completeForm(developer2Tab, {
      username: developerUsername2,
      password: 'developer2-password',
      'remember-minutes': ''
    })
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Home')
    await TestHelperBrowser.clickPageLink(developer2Tab, 'Servers')
    await TestHelperBrowser.clickFrameLink(developer2Tab, 'Administration')
    await TestHelperBrowser.completeForm(developer2Tab, {
      email: testUserData[3].email,
      'first-name': testUserData[3].firstName,
      'last-name': testUserData[3].lastName,
    })
    const administrationFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const pageTitle = await administrationFrame.evaluate(() => {
      return document.getElementsByTagName('h1')[0].innerHTML
    })
    assert.strictEqual(pageTitle, 'Administration')
    browser1.close()
    browser2.close()
    browser3.close()
  })
})
