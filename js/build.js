Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function (opts) {
      return new Promise(function(resolve, reject) {
        Fliplet.Navigate.to({
          action: 'url',
          inAppBrowser: true,
          url: Fliplet.Env.get('apiUrl') + 'v1/session/authorize/saml2?' + Fliplet.Env.get('appId'),
          onmessage: function(message) {
            // resolve when authentication flow is done
            resolve(message);
          }
        })
      });
      
      // redirect to v1/session/authorize/saml2?appId=1
      return Promise.resolve(); 
    }
  }
});
