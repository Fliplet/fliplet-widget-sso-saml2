Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    /**
     * Starts the SAML2 authorization flow.
     *
     * - On iOS, this will open the URL using the system browser to comply with
     *   OAuth provider policies (e.g. Google disallows embedded web views).
     * - On iOS 12 specifically, we also enable basicAuth to ensure pause/resume
     *   events are captured correctly when the user returns to the app.
     *
     * @param {Object} [opts] Optional configuration for the authorization flow.
     * @param {boolean} [opts.inAppBrowser] Optional override. If true, forces opening
     * the URL in the in-app browser; if false, forces using the system browser.
     * @param {boolean} [opts.basicAuth] Optional. Internal flag passed to Fliplet.Navigate to allow pause/resume handling.
     * @returns {Promise<void>} Resolves when the session is authorized or rejects if authorization is incomplete.
     */
    authorize: function(opts) {
      opts = opts || {};

      var inAppBrowser = true;

      // Allow consumers to explicitly override how the URL should open
      if (typeof opts.inAppBrowser === 'boolean') {
        inAppBrowser = opts.inAppBrowser;
      }

      // Always prefer the system browser on iOS to comply with OAuth policies
      // such as Google's disallowed_useragent for embedded web views.
      if (Modernizr.ios) {
        inAppBrowser = false;
      }

      // Use Safari on iOS12 to prevent issues with cookies not being saved.
      // ref: https://www.chromium.org/updates/same-site/incompatible-clients
      if (Modernizr.ios && Fliplet.Navigator.device().version.toString().indexOf('12') === 0) {
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
            url: (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + '&auth_token=' + Fliplet.User.getAuthToken(),
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
