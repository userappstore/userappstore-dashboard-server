/* eslint-env mocha */
// require('./test-helper.js')
const fs = require('fs')
const util = require('util')

const headless = process.env.SHOW_BROWSERS !== 'true'
const browserConfiguration = {
  headless,
  args: ['--window-size=1440,900', '--window-position=558,155', '--incognito'],
  slowMo: 0
}

let storagePath
if (!process.env.STORAGE_ENGINE) {
  storagePath = process.env.STORAGE_PATH || `${global.applicationPath}/data`
  if (!fs.existsSync(storagePath)) {
    createFolderSync(storagePath)
  }
}
// for deleting the application server's test data between tests too
const storagePath2 = storagePath.replace('data1', 'data2')

const waitForWebhook = util.promisify(async (webhookType, matching, callback) => {
  if (process.env.DEBUG_ERRORS) {
    console.log('waiting', webhookType)
  }
  async function wait() {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 10)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      if (matching(received)) {
        return callback(null, received)
      }
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 10)
})

module.exports = {
  browserConfiguration,
  createRegistration,
  hoverItem,
  completeForm,
  clickFrameLink,
  clickPageLink,
  waitForWebhook
}

before(() => {
  deleteLocalData(storagePath)
  fs.mkdirSync(storagePath)
  deleteLocalData(storagePath2)
  fs.mkdirSync(storagePath2)
})

afterEach(() => {
  deleteLocalData(storagePath)
  fs.mkdirSync(storagePath)
  deleteLocalData(storagePath2)
  fs.mkdirSync(storagePath2)
})

async function createRegistration (browser, userInfo) {
  const pages = await browser.pages()
  const tab = pages[0]
  await tab.setViewport({ width: 1440, height: 900 })
  await tab.goto(process.env.DASHBOARD_SERVER, { waitLoad: true, waitNetworkIdle: true })
  await tab.waitForSelector('body')
  await completeForm(tab, userInfo)
  return tab
}

async function hoverItem (page, element) {
  await page.waitForSelector(`#${element}`)
  await page.hover(`#${element}`)
  await page.waitFor(400)
}

async function completeForm(page, body, submitButton) {
  if (process.env.DEBUG_ERRORS) {
    console.log('submit', body)
  }
  let frame = await page.frames().find(f => f.name() === 'application-iframe')
  let active = frame || page
  for (const field in body) {
    let element = await active.$(`#${field}`)
    while (!element) {
      await page.waitFor(100)
      frame = frame || await page.frames().find(f => f.name() === 'application-iframe')
      active = frame || page
      element = await active.$(`#${field}`)
    }
    await element.focus()
    await active.waitFor(200)
    await element.click()
    await active.waitFor(200)
    if (body[field]) {
      active.evaluate((data) => { 
        return document.getElementById(data.field).value = '' 
      }, { field })
    }
    await element.type(body[field], { delay: 10 })
    await active.waitFor(200)
  }
  const bodyWas = await active.evaluate(() => {
    return document.body.innerHTML
  })
  await active.waitFor(400)
  await active.focus(submitButton || '#submit-button')
  await active.waitFor(400)
  await active.click(submitButton || '#submit-button')
  while (true) {
    await page.waitFor(100)
    try {
      const bodyNow = await page.evaluate(() => {
        return document.body.innerHTML
      })
      if (bodyWas !== bodyNow && bodyNow.indexOf('Redirecting page') === -1) {
        return page.waitFor(1000)
      }
    } catch (error) {
    }
  }
}

async function clickPageLink(page, text) {
  if (process.env.DEBUG_ERRORS) {
    console.log('page', text)
  }
  let bodyWas = await page.evaluate(() => {
    return document.body.innerHTML
  })
  let links = await page.$x(`//a[contains(text(), '${text}')]`)
  while (!links || !links.length) {
    await page.waitFor(100)
    links = await page.$x(`//a[contains(text(), '${text}')]`)
  }
  const link = links[0]
  await page.waitFor(400)
  await link.focus()
  await page.waitFor(400)
  await link.click()
  while (true) {
    await page.waitFor(100)
    try {
      const bodyNow = await page.evaluate(() => {
        return document.body.innerHTML
      })
      if (bodyWas !== bodyNow && bodyNow.indexOf('Redirecting page') === -1) {
        return
      }
    } catch (error) {
    }
  }
}

async function clickFrameLink(page, text) {
  if (process.env.DEBUG_ERRORS) {
    console.log('frame', text)
  }
  let bodyWas = await page.evaluate(() => {
    return document.body.innerHTML
  })
  let frame = await page.frames().find(f => f.name() === 'application-iframe')
  while (!frame) {
    await page.waitFor(100)
    frame = await page.frames().find(f => f.name() === 'application-iframe')
  }
  let links = await frame.$x(`//a[contains(text(), '${text}')]`)
  while (!links || !links.length) {
    await page.waitFor(100)
    links = await frame.$x(`//a[contains(text(), '${text}')]`)
  }
  const link = links[0]
  await page.waitFor(400)
  await link.focus()
  await page.waitFor(200)
  await link.click()
  while (true) {
    await page.waitFor(100)
    try {
      const bodyNow = await page.evaluate(() => {
        return document.body.innerHTML
      })
      if (bodyWas !== bodyNow && bodyNow.indexOf('Redirecting page') === -1) {
        return
      }
    } catch (error) {
    }
  }
}

function deleteLocalData(currentPath) {
  if (!fs.existsSync(currentPath)) {
    return
  }
  const contents = fs.readdirSync(currentPath)
  for (const item of contents) {
    var itemPath = `${currentPath}/${item}`
    const stat = fs.lstatSync(itemPath)
    if (stat.isDirectory()) {
      deleteLocalData(itemPath)
    } else {
      fs.unlinkSync(itemPath)
    }
  }
  fs.rmdirSync(currentPath)
}

function createFolderSync (path) {
  const nested = path.substring(storagePath.length + 1)
  const nestedParts = nested.split('/')
  let nestedPath = storagePath
  for (const part of nestedParts) {
    nestedPath += `/${part}`
    if (!fs.existsSync(nestedPath)) {
      fs.mkdirSync(nestedPath)
    }
  }
}
