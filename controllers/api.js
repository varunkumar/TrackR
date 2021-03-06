var secrets = require('../config/secrets');
var User = require('../models/User').User, Event = require('../models/User').Event;
var querystring = require('querystring');
var validator = require('validator');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var graph = require('fbgraph');
var LastFmNode = require('lastfm').LastFmNode;
var tumblr = require('tumblr.js');
var foursquare = require('node-foursquare')({ secrets: secrets.foursquare });
var Github = require('github-api');
var Twit = require('twit');
var stripe =  require('stripe')(secrets.stripe.apiKey);
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var Linkedin = require('node-linkedin')(secrets.linkedin.clientID, secrets.linkedin.clientSecret, secrets.linkedin.callbackURL);
var clockwork = require('clockwork')({key: secrets.clockwork.apiKey});
var ig = require('instagram-node').instagram();
var Y = require('yui/yql');
var _ = require('lodash');
var natural = require('natural'), typeClassifier = new natural.BayesClassifier();;

function trainClassifiers() {
  typeClassifier.addDocument("Need units A1+ #Blood Hospital",'blood');
  typeClassifier.addDocument("Need units O+ #Blood Hospital",'blood');
  typeClassifier.addDocument("Need units Blood hospital",'blood');
  typeClassifier.addDocument("Blood urgent", 'blood');
  typeClassifier.addDocument("Bleeding Blood",'blood');
  typeClassifier.addDocument("#Blood",'blood');

  typeClassifier.addDocument("#Sale tickets",'ad');
  typeClassifier.addDocument("Sale #tickets",'ad');
  typeClassifier.addDocument("Sale urgent call", "ad");
  typeClassifier.addDocument("Sale tickets hackfest #urgent",'ad');
  typeClassifier.addDocument("Buy tickets discount #urgent",'ad');
  typeClassifier.addDocument("Buy groceries",'ad');

  typeClassifier.addDocument("#Lost missing",'lost');
  typeClassifier.addDocument("#Lost ball point pen",'lost');
  typeClassifier.addDocument("#lost urgent track",'lost');
  typeClassifier.addDocument("Lost urgent",'lost');
  typeClassifier.addDocument("found claim",'lost');
  typeClassifier.addDocument("#Found",'lost');

  typeClassifier.train();
}

trainClassifiers();

/**
 * GET /api
 * List of API examples.
 */

exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'API Examples'
  });
};

/**
 * GET /api/foursquare
 * Foursquare API example.
 */

exports.getFoursquare = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'foursquare' });
  console.log(token);
  async.parallel({
    trendingVenues: function(callback) {
      foursquare.Venues.getTrending('40.7222756', '-74.0022724', { limit: 50 }, token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    venueDetail: function(callback) {
      foursquare.Venues.getVenue('49da74aef964a5208b5e1fe3', token.accessToken, function(err, results) {
        callback(err, results);
      });
    },
    userCheckins: function(callback) {
      foursquare.Users.getCheckins('self', null, token.accessToken, function(err, results) {
        callback(err, results);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/foursquare', {
      title: 'Foursquare API',
      trendingVenues: results.trendingVenues,
      venueDetail: results.venueDetail,
      userCheckins: results.userCheckins
    });
  });
};

/**
 * GET /api/tumblr
 * Tumblr API example.
 */

exports.getTumblr = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'tumblr' });
  var client = tumblr.createClient({
    consumer_key: secrets.tumblr.consumerKey,
    consumer_secret: secrets.tumblr.consumerSecret,
    token: token.accessToken,
    token_secret: token.tokenSecret
  });
  client.posts('withinthisnightmare.tumblr.com', { type: 'photo' }, function(err, data) {
    res.render('api/tumblr', {
      title: 'Tumblr API',
      blog: data.blog,
      photoset: data.posts[0].photos
    });
  });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */

exports.getFacebook = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
    getMe: function(done) {
      graph.get(req.user.facebook, function(err, me) {
        done(err, me);
      });
    },
    getMyFriends: function(done) {
      graph.get(req.user.facebook + '/friends', function(err, friends) {
        done(err, friends.data);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/facebook', {
      title: 'Facebook API',
      me: results.getMe,
      friends: results.getMyFriends
    });
  });
};

/**
 * GET /api/scraping
 * Web scraping example using Cheerio library.
 */

exports.getScraping = function(req, res, next) {
  request.get('https://news.ycombinator.com/', function(err, request, body) {
    if (err) return next(err);
    var $ = cheerio.load(body);
    var links = [];
    $(".title a[href^='http'], a[href^='https']").each(function() {
      links.push($(this));
    });
    res.render('api/scraping', {
      title: 'Web Scraping',
      links: links
    });
  });
};

/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = function(req, res) {
  var token = _.find(req.user.tokens, { kind: 'github' });
  var github = new Github({ token: token.accessToken });
  var repo = github.getRepo('sahat', 'requirejs-library');
  repo.show(function(err, repo) {
    res.render('api/github', {
      title: 'GitHub API',
      repo: repo
    });
  });

};

/**
 * GET /api/aviary
 * Aviary image processing example.
 */

exports.getAviary = function(req, res) {
  res.render('api/aviary', {
    title: 'Aviary API'
  });
};

/**
 * GET /api/nyt
 * New York Times API example.
 */

exports.getNewYorkTimes = function(req, res, next) {
  var query = querystring.stringify({ 'api-key': secrets.nyt.key, 'list-name': 'young-adult' });
  var url = 'http://api.nytimes.com/svc/books/v2/lists?' + query;
  request.get(url, function(error, request, body) {
    if (request.statusCode === 403) return next(Error('Missing or Invalid New York Times API Key'));
    var bestsellers = JSON.parse(body);
    res.render('api/nyt', {
      title: 'New York Times API',
      books: bestsellers.results
    });
  });
};

/**
 * GET /api/lastfm
 * Last.fm API example.
 */

exports.getLastfm = function(req, res, next) {
  var lastfm = new LastFmNode(secrets.lastfm);
  async.parallel({
    artistInfo: function(done) {
      lastfm.request('artist.getInfo', {
        artist: 'Sirenia',
        handlers: {
          success: function(data) {
            done(null, data);
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopTracks: function(done) {
      lastfm.request('artist.getTopTracks', {
        artist: 'Sirenia',
        handlers: {
          success: function(data) {
            var tracks = [];
            _.each(data.toptracks.track, function(track) {
              tracks.push(track);
            });
            done(null, tracks.slice(0,10));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    },
    artistTopAlbums: function(done) {
      lastfm.request('artist.getTopAlbums', {
        artist: 'Sirenia',
        handlers: {
          success: function(data) {
            var albums = [];
            _.each(data.topalbums.album, function(album) {
              albums.push(album.image.slice(-1)[0]['#text']);
            });
            done(null, albums.slice(0, 4));
          },
          error: function(err) {
            done(err);
          }
        }
      });
    }
  },
  function(err, results) {
    if (err) return next(err.message);
    var artist = {
      name: results.artistInfo.artist.name,
      image: results.artistInfo.artist.image.slice(-1)[0]['#text'],
      tags: results.artistInfo.artist.tags.tag,
      bio: results.artistInfo.artist.bio.summary,
      stats: results.artistInfo.artist.stats,
      similar: results.artistInfo.artist.similar.artist,
      topAlbums: results.artistTopAlbums,
      topTracks: results.artistTopTracks
    };
    res.render('api/lastfm', {
      title: 'Last.fm API',
      artist: artist
    });
  });
};

/**
 * GET /api/twitter
 * Twiter API example.
 */

exports.getTwitter = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var T = new Twit({
    consumer_key: secrets.twitter.consumerKey,
    consumer_secret: secrets.twitter.consumerSecret,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });
  /*T.get('search/tweets', { q: 'nodejs since:2013-01-01', geocode: '40.71448,-74.00598,5mi', count: 10 }, function(err, reply) {
    if (err) return next(err);
    res.render('api/twitter', {
      title: 'Twitter API',
      tweets: reply.statuses
    });
  });*/
  Event.find({userId: req.user._id, status: 'open'}, function(err, results) {
    res.render('api/twitter', {
      title: 'Post your tweet',
      events: results
    });
  });
};

exports.stopTracking = function(req, res, next) {
  var tweetId = req.params.tweetId;
  Event.update({userId: req.user._id, status: 'open', tweetId: tweetId}, {$set: {status: 'closed'}}, function(err, e) {
    req.flash('success', { msg: 'Your tweet has expired and the virtual number has been deactivated.'});
    res.redirect('/api/twitter');
  });
}

exports.callForward = function(req, res) {
  console.log("Virtual Number: " + req.query.virtualnumber);
  console.log("Caller Number: " + req.query.callernumber);
  console.log("Extension: " + req.query.extension);

  Event.findOne({status: 'open', extension: Number(req.query.extension)}, function(err, e) {
    if (err || e == null) {
      res.writeHead(200, {'Content-Type': 'application/xml'});
      res.end('<response><status>success</status><mapped_number>9449052884</mapped_number></response>');  
    } else {
      res.writeHead(200, {'Content-Type': 'application/xml'});
      res.end('<response><status>success</status><mapped_number>' + e.phone + '</mapped_number></response>');
    }
  });
};

exports.searchEvent = function(req, res, next) {
  var tweetId = req.body.tweetId;
  var tweet = req.body.tweet;

  Event.findOne({tweetId: tweetId}, function(err, e) {
    if (err || e == null) {
      // Tweet has not been tracked. DO NLP to match it with other tracked tweets
      var classifications = typeClassifier.getClassifications(tweet), type;
      if (classifications[0] && classifications[1] && classifications[2] && classifications[0].value == classifications[1].value && classifications[1].value == classifications[2].value) {
        type = null;
      } else if (classifications[0]) {
        type = classifications[0].label;
      }

      
      if (type == 'blood' || type == 'ad' || type == 'lost') {
        // Compare with similar tweets that we are tracking
        Event.find({type: type}, function(err, results) {
          if (err || results == null || results.length == 0) {
            // Relevant tweet. Not being tracked.
            console.log("Path-1 - " + tweetId);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({matchMethod: "fuzzy", matchType: type, data: null}));
          } else {
            var maxDistance = 0, similarTweet;
            for (var i = 0; i < results.length; i++) {
              var distance = natural.DiceCoefficient(tweet, results[i].tweet);
              if (distance > maxDistance) {
                maxDistance = distance;
                similarTweet = results[i];
              }
            }

            if (maxDistance > 0.8) {
              // Relevant and found a similar tweet
              console.log("Path-2 - " + tweetId);
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({matchMethod: 'fuzzy', data: similarTweet}));
            } else {
              // Relevant but not found a similar tweet. Not being tracked.
              console.log("Path-3 - " + tweetId); 
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({matchMethod: "fuzzy", matchType: type, data: null}));
            }
          }
        });
      } else {
        // Not relevant. Do nothing
        console.log("Path-4 - " + tweetId);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end('null');
      }
    } else {
      console.log("Path-5 - " + tweetId);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({matchMethod: 'tweetId', data: e}));
    }
  });
};

/**
 * POST /api/twitter
 * @param tweet
 */

exports.postTwitter = function(req, res, next) {
  req.assert('tweet', 'Tweet cannot be empty.').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twitter');
  }

  var token = _.find(req.user.tokens, { kind: 'twitter' });
  var T = new Twit({
    consumer_key: secrets.twitter.consumerKey,
    consumer_secret: secrets.twitter.consumerSecret,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });


  Event.nextCount(function(err, count) {
    var type = req.body.type;
    var tweet = "";
    var virtualNumber = '09066021631 Ext:' + count;
    var e = new Event();

    if (type == "blood") {
        var units = Number(req.body.units);
        var group = req.body.group;
        var hospital = req.body.units;
        var user = req.body.user;
        var phone = req.body.phone;
        var city = req.body.city;

        e.type = type;
        e.units = units;
        e.group = group;
        e.hospital = hospital;
        e.user = user;
        e.phone = phone;
        e.city = city;

        tweet += "#" + city + " ";
        tweet += " Need " + (units == 1 ? '' + group + ' ' : '' + units + ' units of ' + group + ' ');
        tweet += "#Blood @ " + hospital + " ";
        tweet += "Call: " + user + " " + virtualNumber;
    } else if (type == "ad") {
        var item = req.body.item;
        var city = req.body.city;
        var user = req.body.user;
        var phone = req.body.phone;

        e.type = type;
        e.item = item;
        e.user = user;
        e.phone = phone;
        e.city = city;

        tweet += "#Sale ";
        tweet += item + " Pickup: " + city + " ";
        tweet += "Call: " + user + " " + virtualNumber;
    } if (type == "lost") {
        var item = req.body.item;
        var city = req.body.city;
        var user = req.body.user;
        var phone = req.body.phone;

        e.type = type;
        e.item = item;
        e.user = user;
        e.phone = phone;
        e.city = city;

        tweet += "#Lost ";
        tweet += item + " Last seen @ " + city + " ";
        tweet += "Call: " + user + " " + virtualNumber;
    }

    e.tweet = tweet;
    e.userId = req.user._id;

    T.post('statuses/update', { status: tweet }, function(err, data, response) {
      console.log("Tweet id: " + data.id_str + data.user.screen_name);

      e.tweetId = data.id_str;
      e.url = 'http://twitter.com/' + data.user.screen_name + '/statuses/' + e.tweetId;

      e.save(function(err) { 
        req.flash('success', { msg: 'Tweet has been posted.'});
        res.redirect('/api/twitter');
      });
    });
  });
};

/**
 * GET /api/steam
 * Steam API example.
 */

exports.getSteam = function(req, res, next) {
  var steamId = '76561197982488301';
  var query = { l: 'english', steamid: steamId, key: secrets.steam.apiKey };

  async.parallel({
    playerAchievements: function(done) {
      query.appid = '49520';
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?' + qs, json: true }, function(error, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(error, body);
      });
    },
    playerSummaries: function(done) {
      query.steamids = steamId;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?' + qs, json: true }, function(error, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(error, body);
      });
    },
    ownedGames: function(done) {
      query.include_appinfo = 1;
      query.include_played_free_games = 1;
      var qs = querystring.stringify(query);
      request.get({ url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?' + qs, json: true }, function(error, request, body) {
        if (request.statusCode === 401) return done(new Error('Missing or Invalid Steam API Key'));
        done(error, body);
      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/steam', {
      title: 'Steam Web API',
      ownedGames: results.ownedGames.response.games,
      playerAchievemments: results.playerAchievements.playerstats,
      playerSummary: results.playerSummaries.response.players[0]
    });
  });
};

/**
 * GET /api/stripe
 * Stripe API example.
 */

exports.getStripe = function(req, res) {
  res.render('api/stripe', {
    title: 'Stripe API'
  });
};

/**
 * POST /api/stripe
 * @param stipeToken
 * @param stripeEmail
 */

exports.postStripe = function(req, res, next) {
  var stripeToken = req.body.stripeToken;
  var stripeEmail = req.body.stripeEmail;

  stripe.charges.create({
    amount: 395,
    currency: 'usd',
    card: stripeToken,
    description: stripeEmail
  }, function(err, charge) {
    if (err && err.type === 'StripeCardError') {
      req.flash('errors', { msg: 'Your card has been declined.'});
      res.redirect('/api/stripe');
    }
    req.flash('success', { msg: 'Your card has been charged successfully.'});
    res.redirect('/api/stripe');
  });
};

/**
 * GET /api/twilio
 * Twilio API example.
 */

exports.getTwilio = function(req, res) {
  res.render('api/twilio', {
    title: 'Twilio API'
  });
};

/**
 * POST /api/twilio
 * Twilio API example.
 * @param number
 * @param message
 */

exports.postTwilio = function(req, res, next) {
  req.assert('number', 'Phone number is required.').notEmpty();
  req.assert('message', 'Message cannot be blank.').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/twilio');
  }

  var message = {
    to: req.body.number,
    from: '+13472235148',
    body: req.body.message
  };

  twilio.sendMessage(message, function(err, responseData) {
    if (err) return next(err.message);
    req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
    res.redirect('/api/twilio');
  });
};

/**
 * GET /api/clockwork
 * Clockwork SMS API example.
 */

exports.getClockwork = function(req, res) {
  res.render('api/clockwork', {
    title: 'Clockwork SMS API'
  });
};

/**
 * POST /api/clockwork
 * Clockwork SMS API example.
 * @param telephone
 */

exports.postClockwork = function(req, res, next) {
  var message = {
    To: req.body.telephone,
    From: 'Hackathon',
    Content: 'Hello from the Hackathon Starter'
  };
  clockwork.sendSms(message, function(err, responseData) {
    if (err) return next(err.errDesc);
    req.flash('success', { msg: 'Text sent to ' + responseData.responses[0].to });
    res.redirect('/api/clockwork');
  });
};

/**
 * GET /api/venmo
 * Venmo API example.
 */

exports.getVenmo = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'venmo' });
  var query = querystring.stringify({ access_token: token.accessToken });

  async.parallel({
    getProfile: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/me?' + query, json: true }, function(err, request, body) {
        done(err, body);
      });
    },
    getRecentPayments: function(done) {
      request.get({ url: 'https://api.venmo.com/v1/payments?' + query, json: true }, function(err, request, body) {
        done(err, body);

      });
    }
  },
  function(err, results) {
    if (err) return next(err);
    res.render('api/venmo', {
      title: 'Venmo API',
      profile: results.getProfile.data,
      recentPayments: results.getRecentPayments.data
    });
  });
};

/**
 * POST /api/venmo
 * @param user
 * @param note
 * @param amount
 * Send money.
 */

exports.postVenmo = function(req, res, next) {
  req.assert('user', 'Phone, Email or Venmo User ID cannot be blank').notEmpty();
  req.assert('note', 'Please enter a message to accompany the payment').notEmpty();
  req.assert('amount', 'The amount you want to pay cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/api/venmo');
  }

  var token = _.find(req.user.tokens, { kind: 'venmo' });

  var formData = {
    access_token: token.accessToken,
    note: req.body.note,
    amount: req.body.amount
  };

  if (validator.isEmail(req.body.user)) {
    formData.email = req.body.user;
  } else if (validator.isNumeric(req.body.user) &&
    validator.isLength(req.body.user, 10, 11)) {
    formData.phone = req.body.user;
  } else {
    formData.user_id = req.body.user;
  }

  request.post('https://api.venmo.com/v1/payments', { form: formData }, function(err, request, body) {
    if (err) return next(err);
    if (request.statusCode !== 200) {
      req.flash('errors', { msg: JSON.parse(body).error.message });
      return res.redirect('/api/venmo');
    }
    req.flash('success', { msg: 'Venmo money transfer complete' });
    res.redirect('/api/venmo');
  });
};

/**
 * GET /api/linkedin
 * LinkedIn API example.
 */

exports.getLinkedin = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'linkedin' });
  var linkedin = Linkedin.init(token.accessToken);

  linkedin.people.me(function(err, $in) {
    if (err) return next(err);
    res.render('api/linkedin', {
      title: 'LinkedIn API',
      profile: $in
    });
  });
};

/**
 * GET /api/instagram
 * Instagram API example.
 */

exports.getInstagram = function(req, res, next) {
  var token = _.find(req.user.tokens, { kind: 'instagram' });

  ig.use({ client_id: secrets.instagram.clientID, client_secret: secrets.instagram.clientSecret });
  ig.use({ access_token: token.accessToken });

  async.parallel({
    searchByUsername: function(done) {
      ig.user_search('richellemead', function(err, users, limit) {
        done(err, users);
      });
    },
    searchByUserId: function(done) {
      ig.user('175948269', function(err, user) {
        done(err, user);
      });
    },
    popularImages: function(done) {
      ig.media_popular(function(err, medias) {
        done(err, medias);
      });
    },
    myRecentMedia: function(done) {
      ig.user_self_media_recent(function(err, medias, pagination, limit) {
        done(err, medias);
      });
    }
  }, function(err, results) {
    if (err) return next(err);
    res.render('api/instagram', {
      title: 'Instagram API',
      usernames: results.searchByUsername,
      userById: results.searchByUserId,
      popularImages: results.popularImages,
      myRecentMedia: results.myRecentMedia
    });
  });
};

/**
 * GET /api/yahoo
 * Yahoo API example.
 */
exports.getYahoo = function(req, res) {
  Y.YQL('SELECT * FROM weather.forecast WHERE (location = 10007)', function(response) {
    var location = response.query.results.channel.location;
    var condition = response.query.results.channel.item.condition;
    res.render('api/yahoo', {
      title: 'Yahoo API',
      location: location,
      condition: condition
    });
  });
};