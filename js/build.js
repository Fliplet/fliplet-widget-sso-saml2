Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
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
          Fliplet.Navigate.to({
            action: 'url',
            inAppBrowser: inAppBrowser,
            basicAuth: opts.basicAuth,
            handleAuthorization: false,
            url: (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + authParam,
            onclose: function() {
              Fliplet.Session.get().then(function(session) {
                return Promise.all([
                  Fliplet.App.Storage.set('fl-chat-auth-email', session.user.email),
                  Fliplet.App.Storage.set('fl-chat-user-token', session.auth_token)
                ]).then(function() {
                  if (session.server.passports.saml2 && session.server.passports.saml2.length) {
                    return resolve();
                  }
                })
                  .catch(function() {
                    reject(T('widgets.saml2.errors.loginNotComplete'));
                  });
              });
            }
          });
        });
      });
    }
  };
});
