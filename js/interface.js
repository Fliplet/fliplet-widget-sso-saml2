Fliplet().then(function() {
  var appId = Fliplet.Env.get('appId');

  $(window).on('resize', Fliplet.Widget.autosize);

  $('#entity_id').attr('data-clipboard-text', appId ?
    Fliplet.Env.get('apiUrl') + 'v1/session/providers/saml2/metadata?appId=' + appId + '&auth_token=' + Fliplet.User.getAuthToken() :
    'App ID invalid');

  var clipboard = new Clipboard('#entity_id');
  clipboard.on('success', function(e) {
    $('#entity_id').html('Copied! <i class="fa fa-check"></i>');
    e.clearSelection();

    setTimeout(function() {
      $('#entity_id').html('Copy to clipboard <i class="fa fa-clipboard"></i>');
    }, 2000);
  });

  $('form').submit(function(event) {
    event.preventDefault();

    Fliplet.Widget.save({
      idp: {
        sso_login_url: $('[name="sso_login_url"]').val(),
        sso_logout_url: $('[name="sso_logout_url"]').val(),
        certificates: $('[name="certificates"]').val(),
        allow_unencrypted_assertion: true // This can be optional for future integrations
      }
    }).then(function() {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function() {
    $('form').submit();
  });

  Fliplet.Widget.autosize();
});
