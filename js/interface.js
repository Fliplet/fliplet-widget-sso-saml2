Fliplet().then(function () {
  $(window).on('resize', Fliplet.Widget.autosize);

  $('form').submit(function (event) {
    event.preventDefault();

    Fliplet.Widget.save({
      entity_id: $('[name="entity_id"]').val(),
      private_key: $('[name="private_key"]').val(),
      certificate: $('[name="certificate"]').val(),
      assert_endpoint: $('[name="assert_endpoint"]').val()
    }).then(function () {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function () {
    $('form').submit();
  });
});
