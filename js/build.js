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
          var authUrl = (Fliplet.Env.get('primaryApiUrl') || Fliplet.Env.get('apiUrl')) + 'v1/session/authorize/saml2?appId=' + Fliplet.Env.get('masterAppId') + '&auth_token=' + Fliplet.User.getAuthToken();

          function onSessionReady(session) {
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
          }

          // On web, use session polling to detect auth completion.
          // This avoids relying on popup.closed which is blocked by
          // Cross-Origin-Opener-Policy headers set by IdPs like Azure AD.
          if (Fliplet.Env.get('platform') === 'web') {
            var popup = window.open(authUrl, '_blank');
            var sessionPollTimer = setInterval(function() {
              var popupClosed = false;

              try {
                popupClosed = !popup || popup.closed;
              } catch (e) {
                // COOP may block access to popup.closed
              }

              Fliplet.Session.get().then(function(session) {
                if (session && session.server && session.server.passports
                    && session.server.passports.saml2
                    && session.server.passports.saml2.length) {
                  clearInterval(sessionPollTimer);

                  // Close the popup if it's still open and accessible
                  try {
                    if (popup && !popup.closed) {
                      popup.close();
                    }
                  } catch (e) {
                    // Ignore if COOP blocks access
                  }

                  onSessionReady(session);
                } else if (popupClosed) {
                  // Popup was closed without completing auth — check session one last time
                  clearInterval(sessionPollTimer);
                  Fliplet.Session.get().then(function(finalSession) {
                    if (finalSession && finalSession.server && finalSession.server.passports
                        && finalSession.server.passports.saml2
                        && finalSession.server.passports.saml2.length) {
                      onSessionReady(finalSession);
                    } else {
                      reject(T('widgets.saml2.errors.loginNotComplete'));
                    }
                  }).catch(function() {
                    reject(T('widgets.saml2.errors.loginNotComplete'));
                  });
                }
              });
            }, 1000);

            return;
          }

          // Native platforms: use InAppBrowser via Fliplet.Navigate.to with onclose
          Fliplet.Navigate.to({
            action: 'url',
            inAppBrowser: inAppBrowser,
            basicAuth: opts.basicAuth,
            handleAuthorization: false,
            url: authUrl,
            onclose: function() {
              Fliplet.Session.get().then(function(session) {
                onSessionReady(session);
              });
            }
          });
        });
      });
    }
  };
});
