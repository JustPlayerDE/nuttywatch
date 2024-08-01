# NuttyWatch

This is primarily a prototype.

## Streamerbot Version

The streamerbot version supports Twitch and Youtube chat, but it requires an unsecured websocket connection to work.

If you don't know how to self-host or how to bypass the HTTPS mixed content restrictions, you can use the unsecured version here:

http://nuttywatch.justplayer.de/#socket=127.0.0.1:8080


By default, streamer.bot will only listen on the local (127.0.0.1) interfaces, to make this work you have to set the ip address of the websocket server to `0.0.0.0` to make it listen on all interfaces.

![Streamer.bot websocket server example](assets/streamerbot_websocket_settings.png?raw=true "Example of the Websocket server settings you can use.")

You could also try the "custom websocket server" stuff, but for me it stopped working randomly.

> I do not collect nor do i use any data about you or your chat. But please keep in mind that i technically have full access to your Streamerbot instance if you use the version hosted on my own domain. I recommend hosting the files yourself on a local server instead.

> Funfact: Everything after # in a url is clientside only and never sent to the server, that way - unless i modify the javascript directly - not even i know where your local server is and it also wont be logged anywhere on the server.

## Old Twitch only Version

You can use the Twitch only version like this:
`https://justplayerde.github.io/nuttywatch/twitch/?streamer=<YOUR TWITCH NAME>`

Example: https://justplayerde.github.io/nuttywatch/twitch/?streamer=nutty