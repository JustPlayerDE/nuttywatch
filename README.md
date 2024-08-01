# NuttyWatch

This is primarily a prototype.

## Streamerbot Version

The streamerbot version supports Twitch and Youtube chat, but it requires an unsecured websocket connection to work.

If you don't know how to self-host or how to bypass the HTTPS mixed content restrictions, you can use the unsecured version here:

http://nuttywatch.justplayer.de/#socket=127.0.0.1:8080


By default Streamer.bot will only listen on local connections, to make the chat connect from other devices (e.g. your smartwatch) you have to define another websocket server in `Server/Clients > Websocket Servers`.
Do not change the main websocket server settings as they are required for your local widgets and obs sources to connect to your local streamerbot instance.

![Streamer.bot websocket server settings example](assets/streamerbot_websocket_server_config.png?raw=true "Example of the Websocket server settings you can use.")

> I do not collect nor do i use any data about you or your chat. But please keep in mind that i technically have full access to your Streamerbot instance if you use the version hosted on my own domain. I recommend hosting the files yourself on a local server instead.

> Funfact: Everything after # in a url is clientside only and never sent to the server, that way - unless i modify the javascript directly - not even i know where your local server is and it also wont be logged anywhere on the server.

## Old Twitch only Version

You can use the Twitch only version like this:
`https://justplayerde.github.io/nuttywatch/twitch/?streamer=<YOUR TWITCH NAME>`

Example: https://justplayerde.github.io/nuttywatch/twitch/?streamer=nutty