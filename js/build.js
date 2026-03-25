Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  var appId = Fliplet.Env.get('masterAppId');
  var logPrefix = '[DEBUG] [SAML2 SSO] appId: ' + appId;

  return {
    authorize: function(opts) {
      opts = opts || {};

      var inAppBrowser = true;

      // Use Safari on iOS12 to prevent issues with cookies not being saved.
      // ref: https://www.chromium.org/updates/same-site/incompatible-clients
      if (Modernizr.ios && Fliplet.Navigator.device().version.toString().indexOf('12') === 0) {
        inAppBrowser = false;

        // Allow pause/resume events to be registered
        opts.basicAuth = true;
      }

      console.log(logPrefix, 'authorize() called, platform:', Fliplet.Env.get('platform'), 'inAppBrowser:', inAppBrowser);

      // Ensure a session is created so that the token being used by the system browser (or IAB) is the same
      // as the resulting session which could have been generated if this went out with an app token instead.
      return Fliplet.Session.get().then(function() {
        console.log(logPrefix, 'initial session obtained, opening popup');

        return new Promise(function(resolve, reject) {
          var authUrl = (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + appId + '&auth_token=' + Fliplet.User.getAuthToken();

          console.log(logPrefix, 'navigating to auth URL:', authUrl.replace(/auth_token=[^&]+/, 'auth_token=REDACTED'));

          Fliplet.Navigate.to({
            action: 'url',
            inAppBrowser: inAppBrowser,
            basicAuth: opts.basicAuth,
            handleAuthorization: false,
            url: authUrl,
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
