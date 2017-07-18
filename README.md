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