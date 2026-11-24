/**
 * PS-2445 — which browser authorize() opens the sign-in page in.
 *
 * Runs js/build.js against stubbed Fliplet APIs and asserts the options passed
 * to Fliplet.Navigate.to(). Runnable standalone: `node tests/android-system-browser.js`
 */

/* eslint-env node */
/* eslint-disable no-console */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BUILD = fs.readFileSync(path.join(__dirname, '../js/build.js'), 'utf8');

/**
 * @param {Object} scenario - { platform, android, ios, iosVersion, opts }
 * @returns {Promise<Object>} the options authorize() passed to Fliplet.Navigate.to
 */
function navigateOptionsFor(scenario) {
  return new Promise(function(resolve) {
    let widget;

    const env = { platform: scenario.platform, masterAppId: 1, apiUrl: 'https://api.test/' };

    vm.runInNewContext(BUILD, {
      console: { log: function() {}, warn: function() {}, error: function() {} },
      Promise: Promise,
      Modernizr: { android: !!scenario.android, ios: !!scenario.ios },
      Fliplet: {
        Widget: { register: function(name, factory) { widget = factory(); } },
        Env: { get: function(key) { return env[key]; } },
        Navigator: { device: function() { return { version: scenario.iosVersion || '18.7' }; } },
        Session: { get: function() { return Promise.resolve({}); } },
        API: { request: function() { return Promise.resolve({ state: 'one-time-state' }); } },
        User: { getAuthToken: function() { return 'token'; } },
        Navigate: { to: resolve }
      }
    });

    widget.authorize(scenario.opts);
  });
}

const cases = [
  {
    name: 'Android native app with the option on opens the system browser',
    scenario: { platform: 'native', android: true, opts: { androidSystemBrowser: true } },
    expected: { inAppBrowser: false, basicAuth: true }
  },
  {
    name: 'Android native app with the option off stays in the in-app browser',
    scenario: { platform: 'native', android: true, opts: {} },
    expected: { inAppBrowser: true, basicAuth: undefined }
  },
  {
    name: 'Android native app ignores Basic Access Authentication on its own',
    scenario: { platform: 'native', android: true, opts: { basicAuth: true } },
    expected: { inAppBrowser: true, basicAuth: true }
  },
  {
    name: 'iOS native app with the option on stays in the in-app browser',
    scenario: { platform: 'native', ios: true, opts: { androidSystemBrowser: true } },
    expected: { inAppBrowser: true, basicAuth: undefined }
  },
  {
    name: 'Web app on an Android browser with the option on is unchanged',
    scenario: { platform: 'web', android: true, opts: { androidSystemBrowser: true } },
    expected: { inAppBrowser: true, basicAuth: undefined }
  },
  {
    name: 'iOS 12 still uses the system browser',
    scenario: { platform: 'native', ios: true, iosVersion: '12.4', opts: {} },
    expected: { inAppBrowser: false, basicAuth: true }
  }
];

cases.reduce(function(previous, testCase) {
  return previous.then(function() {
    return navigateOptionsFor(testCase.scenario).then(function(options) {
      assert.strictEqual(options.inAppBrowser, testCase.expected.inAppBrowser, testCase.name + ' (inAppBrowser)');
      assert.strictEqual(options.basicAuth, testCase.expected.basicAuth, testCase.name + ' (basicAuth)');
      assert.strictEqual(options.url, 'https://api.test/v1/session/authorize/saml2?appId=1&state=one-time-state', testCase.name + ' (url)');
      console.log('ok - ' + testCase.name);
    });
  });
}, Promise.resolve()).catch(function(err) {
  console.error('FAILED - ' + err.message);
  process.exit(1);
});
