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
        return new Promise(function(resolve, reject) {
          Fliplet.Navigate.to({
            action: 'url',
            inAppBrowser: inAppBrowser,
            basicAuth: opts.basicAuth,
            handleAuthorization: false,
            url: (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('appId') + '&auth_token=' + Fliplet.User.getAuthToken(),
            onclose: function() {
              Fliplet.Session.get().then(function(session) {
                if (session.server.passports.saml2 && session.server.passports.saml2.length) {
                  return resolve();
                }

                reject(T('widgets.saml2.errors.loginNotComplete'));
              });
            }
          });
        });
      });
    }
  }
});
