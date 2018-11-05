# Fliplet SSO SAML2 App Component

```js
Fliplet.Widget.get('com.fliplet.sso.saml2')
  .authorize({ foo: 'bar' })
  .then(function onAuthorized() {
    // all good
  })
  .catch(function onError(err) {
    // woop woop
  })
```

To test out the integration, follow the instructions [here](https://github.com/Fliplet/fliplet-widget-login-saml2/blob/master/README.md)

The frontend for this component is found at https://github.com/Fliplet/fliplet-widget-login-saml2
