module("Utilities");

test("should convert a URL into an HTML anchor tag", function() {
  span = $.span('http://www.example.com/');
  span.autolink();
  anchor = span.children('a').first();
  equals(anchor.attr('href'), 'http://www.example.com/');
  equals(anchor.attr('target'), '_blank');
  equals(anchor.text(), 'http://www.example.com/');
});

test("should convert a URL with an HTTPS scheme into an HTML anchor tag", function() {
  span = $.span('https://www.secure.com/');
  span.autolink();
  anchor = span.children('a').first();
  equals(anchor.attr('href'), 'https://www.secure.com/');
});

test("should convert a URL with an FTP scheme into an HTML anchor tag", function() {
  span = $.span('ftp://www.files.com/');
  span.autolink();
  anchor = span.children('a').first();
  equals(anchor.attr('href'), 'ftp://www.files.com/');
});

test("should convert all URLs into HTML anchor tags", function() {
  span = $.span('http://www.example1.com/ http://www.example2.com/ http://www.example3.com/');
  span.autolink();
  anchors = span.children('a')
  equals(anchors.size(), 3);
});

test("should leave text surrounding URLs unchanged", function() {
  span = $.span('Lorem ipsum dolor sit amet http://www.example.com/ consectetur adipiscing elit');
  span.autolink();
  ok(new RegExp('^Lorem ipsum dolor sit amet <a').exec(span.html()));
  ok(new RegExp('\/a> consectetur adipiscing elit$').exec(span.html()));
});

test("should convert a URL with a path containing an '@' into an HTML anchor tag", function() {
  span = $.span('http://www.mail-archive.com/puppet-users@googlegroups.com/msg09156.htm');
  span.autolink();
  anchor = span.children('a').first();
  equals(anchor.attr('href'), 'http://www.mail-archive.com/puppet-users@googlegroups.com/msg09156.htm');
});

test("should convert a URL with a query string containing an '@' into an HTML anchor tag", function() {
  span = $.span('http://example.com/?email=chris@seagul.co.uk');
  span.autolink();
  anchor = span.children('a').first();
  equals(anchor.attr('href'), 'http://example.com/?email=chris@seagul.co.uk');
});