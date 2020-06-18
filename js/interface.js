Fliplet().then(function() {
  var data = Fliplet.Widget.getData();
  var appId = Fliplet.Env.get('appId');

  if (!$('[name="sso_login_url"]').val()) {
    data.dynamicEntityId = data.dynamicEntityId || true;
  }

  $(window).on('resize', Fliplet.Widget.autosize);

  var $dataSources = $('[name="dataSource"]');
  var $emailAddress = $('[name="emailAddress"]');

  var entityIdUrl = Fliplet.Env.get('apiUrl') + 'v1/session/providers/saml2/metadata';

  if (data.dynamicEntityId) {
    entityIdUrl += '/' + appId;
  } else {
    entityIdUrl += '?appId=' + appId;
  }

  $('#entity_id').attr('data-clipboard-text', appId
    ? entityIdUrl
    : 'App ID invalid'
  );

  var clipboard = new Clipboard('#entity_id');
  clipboard.on('success', function(e) {
    $('#entity_id').html('Copied to clipboard <i class="fa fa-check"></i>');
    e.clearSelection();

    setTimeout(function() {
      $('#entity_id').html('Copy link to XML file <i class="fa fa-clipboard"></i>');
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
      },
      dataSourceId: $dataSources.val(),
      dataSourceEmailColumn: $emailAddress.val() !== 'none'
        ? $emailAddress.val()
        : undefined,
      dynamicEntityId: data.dynamicEntityId,
    }).then(function() {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function() {
    $('form').submit();
  });

  Fliplet.Widget.autosize();

  $('#manage-data').on('click', manageAppData);

  $dataSources.on('change', function() {
    var selectedDataSourceId = $(this).val();
    if (selectedDataSourceId === 'none') {
      $('#manage-data').addClass('hidden');
      $('.column-selection').removeClass('show');
      return;
    }

    if (selectedDataSourceId === 'new') {
      $('#manage-data').addClass('hidden');
      createDataSource();
      return;
    }

    $('.column-selection').addClass('show');
    getColumns(selectedDataSourceId);
  });

  Fliplet.Studio.onMessage(function(event) {
    if (event.data && event.data.event === 'overlay-close') {
      reloadDataSources(event.data.data.dataSourceId);
    }
  });

  function getColumns(dataSourceId) {
    if (!dataSourceId || dataSourceId === '') {
      $('#manage-data').addClass('hidden');
      return;
    }

    $('#manage-data').removeClass('hidden');

    Fliplet.DataSources.getById(dataSourceId, {
      cache: false
    }).then(function (dataSource) {
       var options = [
        '<option value="none">-- Select a field</option>'
      ];

      dataSource.columns.forEach(function (column) {
        options.push('<option value="' + column + '">' + column + '</option>');
      });

      $emailAddress.html(options.join(''));

      if (data.dataSourceEmailColumn) {
        $emailAddress.val(data.dataSourceEmailColumn);
      }

      $emailAddress.removeAttr('disabled');
    });
  }

  function createDataSource() {
    event.preventDefault();
    var name = prompt('Please type a name for your data source:');

    if (name === null) {
      $('#manage-data').addClass('hidden');
      $dataSources.val('none').trigger('change');
      return;
    }

    if (name === '') {
      $('#manage-data').addClass('hidden');
      $dataSources.val('none').trigger('change');
      alert('You must enter a data source name');
      return;
    }

    Fliplet.DataSources.create({
      name: name,
      organizationId: Fliplet.Env.get('organizationId')
    }).then(function(ds) {
      allDataSources.push(ds);
      $dataSources.append('<option value="' + ds.id + '">' + ds.name + '</option>');
      $dataSources.val(ds.id).trigger('change');
    });
  }

  function manageAppData(event) {
    if (event) {
      event.preventDefault();
    }

    var dataSourceId = $dataSources.val();

    Fliplet.Studio.emit('overlay', {
      name: 'widget',
      options: {
        size: 'large',
        package: 'com.fliplet.data-sources',
        title: 'Edit Data Sources',
        classes: 'data-source-overlay',
        data: {
          context: 'overlay',
          dataSourceId: dataSourceId
        }
      }
    });
  }

  function reloadDataSources(dataSourceId) {
    return Fliplet.DataSources.get({
      roles: 'publisher,editor',
      type: null
    }, {
      cache: false
    }).then(function(results) {
      allDataSources = results;
      $dataSources.html('<option value="none">-- Select a data source</option><option disabled>------</option><option value="new">Create a new data source</option><option disabled>------</option>');
      var options = [];

      allDataSources.forEach(function (d) {
        options.push('<option value="' + d.id + '">' + d.name + '</option>');
      });

      $dataSources.append(options.join(''));

      if (dataSourceId) {
        $dataSources.val(dataSourceId);
      }
      $dataSources.trigger('change');
    });
  }

  // Load the data source for the contacts
  Fliplet.DataSources.get({
    roles: 'publisher,editor',
    type: null
  }).then(function (dataSources) {
    allDataSources = dataSources;
    var options = [];

    allDataSources.forEach(function (d) {
      options.push('<option value="' + d.id + '">' + d.name + '</option>');
    });

    $dataSources.append(options.join(''));

    if (data.dataSourceId) {
      $dataSources.val(data.dataSourceId);
    }
    $dataSources.trigger('change');

    $dataSources.prop('disabled', false);
  });
});
