Fliplet().then(function() {
  var data = Fliplet.Widget.getData();
  var appId = Fliplet.Env.get('appId');
  var dataSourceProvider = null;
  var $dataColumnsEmail = $('#emailColumn');

  // Apply defaults for new instances
  if (!$('[name="sso_login_url"]').val()) {
    data.dynamicEntityId = true;
    data.validateSession = true;
  }

  $(window).on('resize', Fliplet.Widget.autosize);

  var $dataSources = $('[name="dataSource"]');

  var metadataUrl = Fliplet.Env.get('apiUrl') + 'v1/session/providers/saml2/metadata';

  if (data.dynamicEntityId) {
    metadataUrl += '/' + appId;
  } else {
    metadataUrl += '?appId=' + appId;
  }

  $('#entity_id').attr('data-clipboard-text', appId
    ? metadataUrl
    : 'App ID invalid'
  );

  if (data.validateSession) {
    $('[name="validateSession"]').prop('checked', true);
  }

  // Defaults to checked
  $('[name="forceAuthentication"]').prop('checked', data.sp && data.sp.force_authn === false ? false : true);

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
      sp: {
        force_authn: !!$('[name="forceAuthentication"]').prop('checked')
      },
      validateSession: !!$('[name="validateSession"]').prop('checked'),
      dataSourceId: data.dataSourceId,
      dataSourceEmailColumn: $dataColumnsEmail.val() !== 'none'
        ? $dataColumnsEmail.val()
        : undefined,
      dynamicEntityId: data.dynamicEntityId
    }).then(function() {
      Fliplet.Widget.complete();
    });
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function() {
    dataSourceProvider.forwardSaveRequest();
  });

  Fliplet.Widget.autosize();

  function initDataSourceProvider(currentDataSourceId) {
    var dataSourceData = {
      dataSourceTitle: 'Profile data source',
      dataSourceId: currentDataSourceId,
      appId: Fliplet.Env.get('appId'),
      default: {
        name: 'Profile data for ' + Fliplet.Env.get('appName'),
        entries: [],
        columns: []
      },
      accessRules: []
    };

    dataSourceProvider = Fliplet.Widget.open('com.fliplet.data-source-provider', {
      selector: '#dataSourceProvider',
      data: dataSourceData,
      onEvent: function(event, dataSource) {
        if (event === 'dataSourceSelect') {
          onDataSourceSelect(dataSource);
        }
      }
    });

    dataSourceProvider.then(function(dataSource) {
      data.dataSourceId = dataSource.data.id;
      $('form').submit();
    });
  }

  function onDataSourceSelect(dataSource) {
    $dataColumnsEmail.html(
      '<option selected value="">-- Select email column</option>'
    );

    // Appends Column Titles to new Select Box
    if (dataSource.columns) {
      dataSource.columns.forEach(function(column) {
        $dataColumnsEmail.append(
          '<option value="' + column + '">' + column + '</option>'
        );
      });
    }

    if (data.dataSourceEmailColumn) {
      dataSource.columns.forEach(function(column) {
        if (column === data.dataSourceEmailColumn) {
          $dataColumnsEmail.val(data.dataSourceEmailColumn);
        }
      });
    }

    $('#select-email-field').toggleClass('hidden', !dataSource.id);
  }

  // Load the data source for the contacts
  Fliplet.DataSources.get({
    roles: 'publisher,editor',
    type: null
  }).then(function(dataSources) {
    allDataSources = dataSources;
    var options = [];

    allDataSources.forEach(function(d) {
      options.push('<option value="' + d.id + '">' + d.name + '</option>');
    });

    $dataSources.append(options.join(''));

    if (data.dataSourceId) {
      initDataSourceProvider(data.dataSourceId);

      return;
    }

    initDataSourceProvider();
  });
});
