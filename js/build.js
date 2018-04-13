Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function(opts) {
      opts = opts || {};

      return new Promise(function(resolve, reject) {
        Fliplet.Navigate.to({
          action: 'url',
          inAppBrowser: true,
          basicAuth: opts.basicAuth,
          handleAuthorization: false,
          url: Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + '&auth_token=' + Fliplet.User.getAuthToken(),
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
