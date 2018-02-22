Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function(opts) {
      opts = opts || {};

      return new Promise(function(resolve, reject) {
        var url = Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('appId') + '&auth_token=' + Fliplet.User.getAuthToken();

        if (opts.username) {
          url += '&username' + encodeURIComponent(opts.username);
        }

        if (opts.password) {
          url += '&password' + encodeURIComponent(opts.password);
        }

        Fliplet.Navigate.to({
          action: 'url',
          inAppBrowser: true,
          handleAuthorization: false,
          url: url,
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
