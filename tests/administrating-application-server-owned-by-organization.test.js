/* eslint-env mocha */
const assert = require('assert')
const puppeteer = require('puppeteer')
const TestHelper = require('../test-helper.js')
const testUserData = require('@userappstore/dashboard/test-data.json')

// Test that organization members can administrate servers
// that the organization owns
// 
// 1) the owner account registers and idles on the accounts page
// 2) a developer account registers, creates an organization, and claims
//    an application server owned by that organization, then accesses
//    the server administration home
// 3) another developer registers, joins the organization, then accesses
//    the server administration home

describe.only(`tests/administrating-application-server-owned-by-organization`, () => {
  it('should administrate server shared with organization', async () => {
    global.pageSize = 40
    // owner
    const browser1 = await puppeteer.launch(TestHelper.browserConfiguration)
    const ownerUsername = 'owner-username-' + Math.floor(new Date().getTime() / 1000)
    const ownerTab = await TestHelper.createRegistration(browser1, {
      username: ownerUsername,
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
    await TestHelper.hoverItem(developerTab, 'account-menu-container')
    await TestHelper.clickPageLink(developerTab, 'Manage organizations')
    await TestHelper.clickFrameLink(developerTab, 'Create organization')
    await TestHelper.completeForm(developerTab, {
      name: 'My organization',
      email: testUserData[2].email
    })
    await TestHelper.completeForm(developerTab, {
      username: developerUsername,
      password: 'developer-password',
      'remember-minutes': ''
    })
    await TestHelper.clickPageLink(developerTab, 'Invitations')
    await TestHelper.clickFrameLink(developerTab, 'Create invitation')
    await TestHelper.completeForm(developerTab, {
      code: 'the-invitation-code'
    })
    const invitationLinkFrame = await developerTab.frames().find(f => f.name() === 'application-iframe')
    const invitationid = await invitationLinkFrame.$eval('.link', e => e.value)
    await TestHelper.clickPageLink(developerTab, 'Home')
    await TestHelper.clickPageLink(developerTab, 'Servers')
    await TestHelper.clickPageLink(developerTab, 'Claim domain')
    await TestHelper.completeForm(developerTab, {
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
    await TestHelper.completeForm(developerTab, {}, '#submit-claim-button')
    testServer.close()
    await TestHelper.clickPageLink(developerTab, 'Home')
    await TestHelper.clickPageLink(developerTab, 'Servers')
    await TestHelper.clickFrameLink(developerTab, 'Administration')
    await TestHelper.completeForm(developerTab, {
      email: testUserData[1].email,
      'first-name': testUserData[1].firstName,
      'last-name': testUserData[1].lastName,
    })
    // second developer
    const browser3 = await puppeteer.launch(TestHelper.browserConfiguration)
    const developerUsername2 = 'second-developer-username-' + Math.floor(new Date().getTime() / 1000)
    const developer2Tab = await TestHelper.createRegistration(browser3, {
      username: developerUsername2,
      password: 'developer2-password',
      confirm: 'developer2-password',
      email: 'other@developer.com',
      'first-name': 'Second',
      'last-name': 'Developer'
    })
    await TestHelper.hoverItem(developer2Tab, 'account-menu-container')
    await TestHelper.clickPageLink(developer2Tab, 'Manage organizations')
    await TestHelper.clickPageLink(developer2Tab, 'Accept invitation')
    await TestHelper.completeForm(developer2Tab, {
      invitationid,
      name: `${testUserData[3].firstName} ${testUserData[3].lastName}`,
      email: testUserData[3].email,
      code: 'the-invitation-code'
    })
    await TestHelper.completeForm(developer2Tab, {
      username: developerUsername2,
      password: 'developer2-password',
      'remember-minutes': ''
    })
    await TestHelper.clickPageLink(developer2Tab, 'Home')
    await TestHelper.clickPageLink(developer2Tab, 'Servers')
    await TestHelper.clickFrameLink(developer2Tab, 'Administration')
    await TestHelper.completeForm(developer2Tab, {
      email: testUserData[3].email,
      'first-name': testUserData[3].firstName,
      'last-name': testUserData[3].lastName,
    })
    const administrationFrame = await developer2Tab.frames().find(f => f.name() === 'application-iframe')
    const pageTitle = await administrationFrame.evaluate(() => {
      return document.getElementsByTagName('h1')[0].innerHTML
    })
    assert.strictEqual(pageTitle, 'Administration')
    browser1.close()
    browser2.close()
    browser3.close()
  })
})
