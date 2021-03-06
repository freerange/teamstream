//= require <json2>
//= require <jquery.min>
//= require <jquery.timeago>
//= require <jquery.cookie>
//= require <jquery.md5>
//= require <utilities>
//= require <display>
//= require <pisswhistle>
//= require <notifier>
//= require <ba-linkify>

$(document).ready(function () {
  PissWhistle.initialize();

  PissWhistle.addHandler(new Chat("#chat"));
  PissWhistle.addHandler(new ChatCorrection());
  PissWhistle.addHandler(new CI());
  PissWhistle.addHandler(new Debug());
  PissWhistle.addHandler(new Deploy("#misc"));
  PissWhistle.addHandler(new Github("#misc"));
  PissWhistle.addHandler(new Presence("#presence"));
  PissWhistle.addHandler(new UnreadMessageCount());
  PissWhistle.addHandler(new Status("#presence"));

  Notifier.initialize();

  if ($(".available_streams").length > 0) {
    PissWhistle.loadStreams(function(streams) {
      $(streams).each(function(index, stream) {
        $(".available_streams").append('<li><a href="/' + stream + '">' + stream + '</a></li>');
      })
    })
  } else {
    PissWhistle.loadMessages('hudson');
    PissWhistle.loadMessages('chat');
    PissWhistle.loadMessages('github');

    setTimeout(function() { PissWhistle.connect()}, 500);

    Display.watch_scrolling();
    setTimeout(function() { Display.scrollPanelsToBottom(); },1000);
  }
})
