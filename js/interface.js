Fliplet().then(function () {
  var appId = Fliplet.Env.get('appId');

  $(window).on('resize', Fliplet.Widget.autosize);

  $('#entity_id').html(
    appId
    ? Fliplet.Env.get('apiUrl') + 'v1/session/providers/saml2/metadata?appId=' + appId + '&auth_token=' + Fliplet.User.getAuthToken()
    : 'App ID invalid'
  );

  $('form').submit(function (event) {
    event.preventDefault();

    Fliplet.Widget.save({
      idp: {
        sso_login_url: $('[name="sso_login_url"]').val(),
        sso_logout_url: $('[name="sso_logout_url"]').val(),
        certificates: $('[name="certificates"]').val()
      }
    }).then(function () {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function () {
    $('form').submit();
  });
});
