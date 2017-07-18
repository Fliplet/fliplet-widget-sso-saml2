Fliplet.Widget.register('com.fliplet.sso.saml2', function registerComponent() {
  return {
    authorize: function (opts) {
      // redirect to v1/session/authorize/saml2?appId=1
      return Promise.resolve(); // resolve when authentication flow is done
    }
  }
});