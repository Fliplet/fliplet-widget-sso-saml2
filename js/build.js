Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function(opts) {
      opts = opts || {};

      var inAppBrowser = true;

      // Use Safari on iOS12 to prevent issues with cookies not being saved.
      // ref: https://www.chromium.org/updates/same-site/incompatible-clients
      if (Modernizr.ios && Fliplet.Navigator.device().version.indexOf('12') === 0) {
        inAppBrowser = false;

        // Allow pause/resume events to be registered
        opts.basicAuth = true;
      }

      return new Promise(function(resolve, reject) {
        Fliplet.Navigate.to({
          action: 'url',
          inAppBrowser: inAppBrowser,
          basicAuth: opts.basicAuth,
          handleAuthorization: false,
          url: (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + '&auth_token=' + Fliplet.User.getAuthToken(),
          onclose: function() {
            Fliplet.Session.get().then(function(session) {
              if (session.server.passports.saml2) {
                return resolve();
              }

              reject('You didn\'t finish the login process.');
            });
          }
        });
      });
    }
  }
});
