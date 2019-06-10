# TrackR

Post requirement. Be private. Track before you offer help.

## Modules

### [Web Portal](http://trackr.varunkumar.me/)

- TrackR currently supports three kinds of requests - blood, buy/sell, Lost & Found
- Users can post their requirements online without getting spammed
- TrackR assigns virtual number to the users thereby the privacy of the user is never compremised
- Users can mark their requirements as closed or delete their requirements from the portal once the requirements are met

### [Chrome Plugin](https://github.com/arunmailer/TrackR-Plugin)

- The plugin provides a way to check the status of a requirement before offering to help
- The plugin automatically scans all the tweets and facebook posts in the page and tags them with a status
- The expired items are marked as closed and the user is not allowed to retweet or share thereby reducing the spam
- For the tweets and FB posts that are being tracked, TrackR will show the appropriate status message from the database and for those that are not traceked, TrackR uses natural language processing to identify a match

### NLP Engine

- Dice's co-efficient is used for distance calculation between strings
- Naive Bayes classifier is used for classify a post in one of the three categories supported by TrackR

## License

The source code is available [here](https://github.com/varunkumar/vbot) under [MIT licence](http://varunkumar.mit-license.org/). Please send any bugs, feedback, complaints, patches to arunmailer[at]gmail[dot]com, varunkumar[dot]n[at]gmail[dot]com.

-- [Arun](http://arunkumarn.com),[Varun](http://www.varunkumar.me)
