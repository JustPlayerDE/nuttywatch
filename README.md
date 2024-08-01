# NuttyWatch

This is primarily a prototype.

You can use the Twitch only version like this:
`https://justplayerde.github.io/nuttywatch/?streamer=<YOUR TWITCH NAME>`

Example: https://justplayerde.github.io/nuttywatch/?streamer=nutty

> The Twitch only version may not be supported in the future, i recommend using the streamerbot version as it just works better and allows more features in the future.


## Streamerbot Version

The streamerbot version supports Twitch and Youtube chat, but it requires an unsecured websocket connection to work.

If you don't know how to self-host or bypass the HTTPS mixed content restrictions, you can use the unsecured version here:

http://nuttywatch.justplayer.de/streamerbot.html#socket=127.0.0.1:8080

Just replace the IP with the IP of the device in your local network where streamerbot is running on.

> I do not collect nor do i use any data about you or your chat. But please keep in mind that i technically have full access to your Streamerbot instance if you use the version hosted on my own domain. I recommend hosting the files yourself on a local server instead.

> Funfact: Everything after # in a url is clientside only and never sent to the server, that way - unless i modify the javascript directly - not even i know where your local server is and it also wont be logged anywhere on the server.