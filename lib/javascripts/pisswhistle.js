var PissWhistle = {
  handlers: {},
  globalHandlers: [],
  messages: [],
  stream_name: null,

  initialize: function(stream_name) {
    this.messages = [];
    this.stream_name = stream_name || this.streamNameFromUrl();
    $(window).resize(this.resizePanels);
  },

  resizePanels: function() {
    $("#content").height($(window).height()-1); // stops flicker?
    $.each($(".fluid"), function(i, panel) {
      $(panel).resizePanel();
      if ($(panel).attr("id") && Display.panels_scrolling[$(panel).attr("id")] == 0) {
        $(panel).scrollToBottom();
      }
    });
    $("#content").height(""); // not sure why this is necessary either
  },

  send: function(data) {
    var data_with_user = $.extend(data, {'user':this.user});
    this.connection.send(data_with_user);
  },

  isNewMessage: function(data) {
    var messageIds = $.map(this.messages, function(m) { return m.id} );
    if ($.inArray(data.id, messageIds) > -1) {
      return false;
    } else {
      return true;
    }
  },

  process: function(data) {
    try {
      if (this.isNewMessage(data)) {
        this.messages.push(data);
        $.each((this.handlers[data.type] || []).concat(this.globalHandlers), function(i, handler) {
          try {
            handler.process(data);
          } catch(err) {
            console.log("Error handling message", handler, err, data);
          }
        });
      } else {
        console.log("ignoring message");
      }
    } catch(err) {
      console.log("error processing message", data, err);
    }
    this.resizePanels();
  },

  loadMessages: function(type, _options, _callback) {
    var options = $.extend({}, _options);
    var self = this;
    var callback = _callback || function(messages) {
      $(messages).each(function(index, message) {
        self.process(message);
      })
    };
    this.connection.loadMessages(this.stream_name, type, options, callback);
  },

  loadStreams: function(callback) {
    this.connection.loadStreams(this.stream_name, callback);
  },

  addHandler: function(handler) {
    if (handler.respondTo == Base.allMessages) {
      this.globalHandlers.push(handler);
    } else {
      var self = this;
      $.each(handler.respondTo, function(i, type) {
        if (self.handlers[type] == null) {
          self.handlers[type] = [handler];
        } else {
          self.handlers[type].push(handler);
        }
      });
    }
  },

  streamNameFromUrl: function() {
    return $(document.location.pathname.split("/")).last()[0];
  },

  connect: function() {
    this.connection.create(this.stream_name);
    // for now poll, perhaps require elegant notification of restart from websocket server?
    setTimeout('PissWhistle.check_connection()',10000);
  },

  check_connection: function() {
    if (this.connection.is_connected()) {
      $("#disconnected").hide();
    } else {
      console.log("Connection has disconnected for some reason...");
      $("#disconnected").show();
    };
    setTimeout('PissWhistle.check_connection()',10000);
    return;
  },

  connection: {
    stream_port: 5032,
    stream_host: 'pisswhistle.gofreerange.com', // override, useful for debugging
    oauth: {
      token: $.cookie('oauth_token'),
      client_identifier: "K7U2x3qk8VuMtySA",
      client_secret: "A8FrX7wO1uDrNZ4op1sQ4UVKIfafiIuP"
    },
    latestHeartbeat: null,
    acceptableLag: 15,

    create: function(stream_name) {
      var self = this;
      if (self.socket) {
        self.socket.close();
        self.socket = null;
      }
      this.ensureAuthenticated(function(token) {
        self.socket = new WebSocket('ws://'+self.stream_host+':' + self.stream_port + '/' + stream_name + '/client?oauth_token=' + token);
        self.socket.onopen = self.onopen;
        self.socket.onmessage = self.onmessage;
        self.socket.onclose = self.onclose;
        self.socket.onerror = self.onerror;
      })
    },

    onopen: function(m){
      document.title = "PissWhistle"
      $("#disconnected").hide();
      console.log("Connection opened");
    },

    onerror: function(m) {
      console.log("Websocket Error", m);
    },

    send: function(object){
      if (this.socket) {
        var result = this.socket.send(JSON.stringify(object))
        console.log("result of sending", result);
      }
    },

    onmessage: function(m) {
      if (m.data) {
        var data = JSON.parse(m.data);
        if (data["error"]) {
          console.log(data["error"]);
        } else if (data["heartbeat"]) {
          PissWhistle.connection.updateHeartbeat(data["heartbeat"]);
        } else {
          PissWhistle.process(data);
        }
      }
    },

    updateHeartbeat: function(timestamp) {
      this.latestHeartbeat = timestamp;
    },

    onclose: function(m) {
      console.log("connection closed")
      this.socket=null;
    },

    is_connected: function() {
      var now = new Date().getTime()/1000;
      var x = this.latestHeartbeat + this.acceptableLag;
      return x > now;
    },

    loadMessages: function(stream_name, type, _options, callback) {
      var self = this;
      this.ensureAuthenticated(function(token) {
        var options = $.extend({type: type, oauth_token: token}, _options)
        $.getJSON('http://'+self.stream_host+':' + self.stream_port+'/' + stream_name + '/messages.json', options, callback);
      })
    },

    loadStreams: function(stream_name, callback) {
      var self = this;
      this.ensureAuthenticated(function(token) {
        $.ajax({
          url: 'http://'+self.stream_host+':' + self.stream_port+'/streams.json?oauth_token=' + token,
          dataType: 'json',
          success: callback
        })
      })
    },

    authenticated: function() {
      return (this.oauth.token != null);
    },

    ensureAuthenticated: function(callback) {
      if (this.authenticated()) {
        console.log("already authenticated");
        callback(this.oauth.token);
      } else {
        this.getAuthenticated(callback);
      }
    },

    getAuthenticated: function(callback) {
      var match = window.location.search.match("code=(.*)")
      if (match) {
        authorization_code = match[1];
        this.getAccessCode(authorization_code, callback);
      } else {
        this.getAuthorizationCode();
      }
    },

    getAuthorizationCode: function() {
      console.log("getting authorization code");
      current_location = window.location
      window.location = 'http://'+this.stream_host+':' + this.stream_port+'/oauth/authorize?client_id=' + this.oauth.client_identifier + '&redirect_uri=' + current_location;
    },

    getAccessCode: function(authorizationCode, callback) {
      console.log("getting access token");
      var self = this;
      $.post('http://'+this.stream_host+':' + this.stream_port+'/oauth/access_token', {
        client_id: self.oauth.client_identifier,
        redirect_uri: window.location.href.split("?")[0],
        client_secret: self.oauth.client_secret,
        grant_type: "authorization_code",
        code: authorization_code
      }, function(data) {
        if (data == null) {
          console.log("unable to obtain access token");
        } else {
          console.log("access token obtained");
          self.oauth.token = data.access_token;
          $.cookie('oauth_token', self.oauth.token, {expires: 365});
          window.history.pushState(null, "without code", window.location.pathname);
          callback(self.oauth.token);
        }
      }, "json")
    }
  }
}
