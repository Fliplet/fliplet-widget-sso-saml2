Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function (opts) {
      return new Promise(function(resolve, reject) {
        Fliplet.Navigate.to({
          action: 'url',
          inAppBrowser: true,
          url: Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?appId' + Fliplet.Env.get('appId'),
          onmessage: function(message) {
            // resolve when authentication flow is done
            resolve(message);
          }
        })
      });
    }
  }
});
