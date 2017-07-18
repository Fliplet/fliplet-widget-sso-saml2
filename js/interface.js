Fliplet().then(function () {
  $(window).on('resize', Fliplet.Widget.autosize);

  $('form').submit(function (event) {
    event.preventDefault();

    Fliplet.Widget.save({
      sso_login_url: $('[name="sso_login_url"]').val(),
      sso_logout_url: $('[name="sso_logout_url"]').val(),
      certificates: $('[name="certificates"]').val()
    }).then(function () {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function () {
    $('form').submit();
  });
});
