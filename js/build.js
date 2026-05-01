Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  var appId = Fliplet.Env.get('masterAppId');
  var logPrefix = '[DEBUG] [SAML2 SSO] appId: ' + appId;

  return {
    authorize: function(opts) {
      opts = opts || {};

      var inAppBrowser = true;

      // DEV-1114 / PS-1748: Use system Safari for SSO on all iOS versions to
      // bypass the Cordova in-app browser cookie isolation. CDVWKInAppBrowser
      // creates a new WKProcessPool on every open (CDVWKInAppBrowser.m:149)
      // which flushes cookies between launches, so SSO sessions never persist
      // and users are prompted to re-authenticate every app launch (Paul Weiss
      // symptom). System Safari has its own persistent cookie store, so SSO
      // sessions survive app launches.
      //
      // Originally (commit 4682f4e, Mar 2020) this workaround was scoped to
      // iOS 12 to address an Apple SameSite cookie bug specific to that
      // version. Apple fixed the SameSite bug in iOS 13, but the IAB cookie
      // flush is a separate issue that affects all iOS versions — generalising
      // the workaround to all iOS covers both.
      //
      // ref: https://www.chromium.org/updates/same-site/incompatible-clients
      // The proper architectural fix (ASWebAuthenticationSession) is tracked
      // separately under DEV-1115.
      if (Modernizr.ios) {
        inAppBrowser = false;

        // Allow pause/resume events to be registered (the existing iOS 12
        // path used this to detect SSO completion when the in-app browser
        // is bypassed — same mechanism applies on iOS 13+).
        opts.basicAuth = true;
      }

      console.log(logPrefix, 'authorize() called, platform:', Fliplet.Env.get('platform'), 'inAppBrowser:', inAppBrowser);

      // Ensure a session is created so that the token being used by the system browser (or IAB) is the same
      // as the resulting session which could have been generated if this went out with an app token instead.
      return Fliplet.Session.get().then(function() {
        // Exchange the real session token for a one-time state token so that
        // auth_token never appears in the URL opened in the in-app browser.
        return Fliplet.API.request({
          url: 'v1/session/authorize/state',
          method: 'POST',
          data: { appId: Fliplet.Env.get('masterAppId'), sso: true }
        }).catch(function(err) {
          console.error('[Fliplet.SSO.SAML2] Failed to obtain state token', err);
          return { state: null };
        });
      }).then(function(response) {
        var authParam = response.state
          ? '&state=' + response.state
          : '&auth_token=' + Fliplet.User.getAuthToken();

        return new Promise(function(resolve, reject) {
          var authUrl = Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?appId=' + appId + '&auth_token=' + Fliplet.User.getAuthToken();

          console.log(logPrefix, 'navigating to auth URL:', authUrl.replace(/auth_token=[^&]+/, 'auth_token=REDACTED'));

          Fliplet.Navigate.to({
            action: 'url',
            inAppBrowser: inAppBrowser,
            basicAuth: opts.basicAuth,
            handleAuthorization: false,
            url: Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + authParam,
            onclose: function() {
              console.log(logPrefix, 'onclose fired, fetching session...');

              Fliplet.Session.get().then(function(session) {
                console.log(logPrefix, 'session fetched, user:', session && session.user && session.user.email, 'hasPassports:', !!(session && session.server && session.server.passports), 'hasSaml2:', !!(session && session.server && session.server.passports && session.server.passports.saml2));

                return Promise.all([
                  Fliplet.App.Storage.set('fl-chat-auth-email', session.user.email),
                  Fliplet.App.Storage.set('fl-chat-user-token', session.auth_token)
                ]).then(function() {
                  if (session.server.passports.saml2 && session.server.passports.saml2.length) {
                    console.log(logPrefix, 'saml2 passport found, resolving');

                    return resolve();
                  }

                  console.warn(logPrefix, 'session has no saml2 passport, passports:', Object.keys((session.server && session.server.passports) || {}));
                  reject(T('widgets.saml2.errors.loginNotComplete'));
                })
                  .catch(function(err) {
                    console.error(logPrefix, 'onclose session check failed:', err);
                    reject(T('widgets.saml2.errors.loginNotComplete'));
                  });
              }).catch(function(err) {
                console.error(logPrefix, 'Fliplet.Session.get() failed after onclose:', err);
                reject(T('widgets.saml2.errors.loginNotComplete'));
              });
            }
          });
        });
      });
    }
  };
});
