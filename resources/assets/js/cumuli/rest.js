(function ($) {

  const _ajax = $.ajax;

  // Will only use method override if $.restSetup.useMethodOverride is set to true
  // Change the values of this global object if your method parameter is different.
  $.restSetup = {
    methodParam: '_method',
    useMethodOverride: false,
    verbs: {
      create: 'POST',
      update: 'PUT',
      destroy: 'DELETE'
    }
  };

  // collect csrf param & token from meta tags if they haven't already been set
  $(document).ready(function () {
    $.restSetup.csrfParam = $.restSetup.csrfParam || $('meta[name=csrf-param]').attr('content');
    $.restSetup.csrfToken = $.restSetup.csrfToken || $('meta[name=csrf-token]').attr('content');
  });

  function collect_options(url, data, success, error) {
    let options = {dataType: 'json'};
    if (arguments.length === 1 && typeof arguments[0] !== "string") {
      options = $.extend(options, url);
      if ("url" in options)
        if ("data" in options) {
          options.url = fill_url(options.url, options.data);
        }
    } else {
      // shift arguments if data argument was omitted
      if ($.isFunction(data)) {
        error = success;
        success = data;
        data = null;
      }

      url = fill_url(url, data);

      options = $.extend(options, {
        url: url,
        data: data,
        success: function (data, text, xhr) {
          if (success) success.call(options.context || options, data, get_headers(xhr), xhr);
        },
        error: function (xhr) {
          if (error) error.call(options.context || options, xhr, get_headers(xhr));
        }
      });
    }
    return options;
  }

  function fill_url(url, data) {
    let key, u, val;
    for (key in data) {
      val = data[key];
      u = url.replace('{' + key + '}', val);
      if (u != url) {
        url = u;
        delete data[key];
      }
    }
    return url;
  }

  function get_headers(xhr) {
    // trim the headers because IE likes to include the blank line between the headers
    // and the content as part of the headers
    var headers = {}, stringHeaders = $.trim(xhr.getAllResponseHeaders());
    $.each(stringHeaders.split("\n"), function (i, header) {
      if (header.length) {
        var matches = header.match(/^([\w\-]+):(.*)/);
        if (matches.length === 3) headers[matches[1]] = $.trim(matches[2]);
      }
    });
    xhr.responseHeaders = headers;
    return headers;
  }

  $.ajax = function (settings) {
    var csrfParam = new RegExp("(" + $.restSetup.csrfParam + "=)", "i"),
      userBeforeSend = settings.beforeSend,
      methodOverride;

    if (typeof settings.data !== "string")
      if (settings.data != null) {
        settings.data = $.param(settings.data);
      }

    settings.data = settings.data || "";
    if ($.restSetup.csrfParam && $.restSetup.csrfToken)
      if (!/^(get)$/i.test(settings.type))
        if (!csrfParam.test(settings.data)) {
          settings.data += (settings.data ? "&" : "") + $.restSetup.csrfParam + '=' + $.restSetup.csrfToken;
        }

    if ($.restSetup.useMethodOverride)
      if (!/^(get|post)$/i.test(settings.type)) {
        methodOverride = settings.type.toUpperCase();
        settings.data += (settings.data ? "&" : "") + $.restSetup.methodParam + '=' + settings.type.toLowerCase();
        settings.type = "POST";
      }

    settings.beforeSend = function (xhr, ajaxSettings) {
      var context = settings.context || settings,
        contentType = settings.contentType,
        resourceContentType = /.*\.(json|xml)/i.exec(settings.url);

      if (!contentType) contentType = $.restSetup.contentType;
      if (!contentType && resourceContentType) {
        contentType = 'application/' + resourceContentType[1].toLowerCase();
      }
      if (settings.contentType != contentType) $.extend(settings, {contentType: contentType});

      if (methodOverride) xhr.setRequestHeader('X-HTTP-Method-Override', methodOverride);

      if ($.isFunction(userBeforeSend)) userBeforeSend.call(context, xhr, ajaxSettings);
    };

    return _ajax.call(this, settings);
  };

  $.extend($.cumuli, {
    rest: {
      get: function () {
        var options = collect_options.apply(this, arguments);
        options.type = 'GET';
        return $.ajax(options);
      },
      post: function () {
        var options = collect_options.apply(this, arguments);
        options.type = 'POST';
        return $.ajax(options);
      },
      put: function () {
        var options = collect_options.apply(this, arguments);
        options.type = $.restSetup.verbs.update;
        return $.ajax(options);
      },
      delete: function () {
        var options = collect_options.apply(this, arguments);
        options.type = $.restSetup.verbs.destroy;
        return $.ajax(options);
      }
    }
  });

})(jQuery);

