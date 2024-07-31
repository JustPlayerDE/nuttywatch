// based on https://gist.github.com/iDerp/51b754514a6d8e0aab203bc27df1b8e4
const chatEle = document.getElementById("chat");
let requiresScrolling = 0;
let chatLog = {
  chat: [],
  timestamp: Math.floor(new Date().getTime() / 1000)
};

function scrollToBottom() {
  // Use setTimeout to allow DOM updates before scrolling
  setTimeout(() => {
    const scrollingElement = (document.scrollingElement || document.body);
    scrollingElement.scrollTop = scrollingElement.scrollHeight;
  }, 0);
}

setInterval(() => {
  if (requiresScrolling > 0) {
    requiresScrolling--;
    scrollToBottom();
  }
}, 10)


function pushLog(item) {
  chatLog?.chat?.push(item);

  if (chatLog?.chat?.length > 30) {
    //chatLog.chat.shift() // test without limit for now
  }

  localStorage.setItem("log", JSON.stringify({
    chat: chatLog?.chat || [],
    timestamp: Math.floor(new Date().getTime() / 1000)
  }));
}

const twitchBadgeCache = {
  data: { global: {} },
};

const bttvEmoteCache = {
  lastUpdated: 0,
  data: { global: [] },
  urlTemplate: "//cdn.betterttv.net/emote/{{id}}/{{image}}",
};

const krakenBase = "https://api.twitch.tv/kraken/";
const krakenClientID = "mm2x54gkkml594gz2ey2jmg94jow3m";

const chatFilters = [
  // '\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF', // Partial Latin-1 Supplement
  // '\u0100-\u017F', // Latin Extended-A
  // '\u0180-\u024F', // Latin Extended-B
  "\u0250-\u02AF", // IPA Extensions
  "\u02B0-\u02FF", // Spacing Modifier Letters
  "\u0300-\u036F", // Combining Diacritical Marks
  "\u0370-\u03FF", // Greek and Coptic
  "\u0400-\u04FF", // Cyrillic
  "\u0500-\u052F", // Cyrillic Supplement
  "\u0530-\u1FFF", // Bunch of non-English
  "\u2100-\u214F", // Letter Like
  "\u2500-\u257F", // Box Drawing
  "\u2580-\u259F", // Block Elements
  "\u25A0-\u25FF", // Geometric Shapes
  "\u2600-\u26FF", // Miscellaneous Symbols
  // '\u2700-\u27BF', // Dingbats
  "\u2800-\u28FF", // Braille
  // '\u2C60-\u2C7F', // Latin Extended-C
];
const chatFilter = new RegExp(`[${chatFilters.join("")}]`);

let client;
let params = new URLSearchParams(document.location.search.substring(1));

let streamer = params.get("streamer") || "nutty";
let showAtTop = params.get("top") == "1";
let timeoutItems = (params.get("timeoutItems") || "false") === "true";
let test = params.get("test") == "1";


if (showAtTop) {
  chatEle.classList.add("top")
}

// Read testing from query
let testing = params.get("testing") == "1";

if (testing) {
  kraken({
    endpoint: "streams",
    qs: {
      limit: 3,
      language: "en",
    },
  }).then(({ streams }) => {
    client = new tmi.client({
      // options: { debug: true },
      connection: {
        reconnect: true,
        secure: true,
      },

      // channels: [ streamer ],
      channels: streams.map((n) => n.channel.name),
    });

    addListeners();
    client.connect();
  });
} else {
  client = new tmi.client({
    // options: { debug: true },
    connection: {
      reconnect: true,
      secure: true,
    },

    channels: [streamer],
  });

  addListeners();
  client.connect();
}

function addListeners() {
  client.on("connecting", () => {
    showAdminMessage({
      message: "Connecting...",
      attribs: { subtype: "connecting" },
    });

    removeAdminChatLine({ subtype: "disconnected" });
  });

  client.on("connected", () => {
    //getBTTVEmotes();
    getBadges().then((badges) => (twitchBadgeCache.data.global = badges));
    showAdminMessage({
      message: "Connected!",
      attribs: { subtype: "connected" },
      timeout: 1000,
    });

    removeAdminChatLine({ subtype: "connecting" });
    removeAdminChatLine({ subtype: "disconnected" });
  });

  client.on("disconnected", () => {
    twitchBadgeCache.data = { global: {} };
    bttvEmoteCache.data = { global: [] };
    showAdminMessage({
      message: "Disconnected :O",
      attribs: { subtype: "disconnected" },
    });

    removeAdminChatLine({ subtype: "connecting" });
    removeAdminChatLine({ subtype: "connected" });
  });

  function handleMessage(channel, userstate, message, fromSelf) {
    if (chatFilter.test(message)) {
      testing && console.log(message);
      return;
    }

    let chan = getChan(channel);
    let name = userstate["display-name"] || userstate.username;
    if (/[^\w]/g.test(name)) {
      name += ` (${userstate.username})`;
    }
    userstate.name = name;

    pushLog({ chan, type: "chat", message, data: userstate, timeout: 30_000, _sent: new Date().getTime() })

    showMessage({ chan, type: "chat", message, data: userstate, timeout: 30_000 });
  }

  if (test) {
    setInterval(function () {
      let userid = Math.floor(Math.random() * 100);
      if (Math.random() > 0.4) {
        return;
      }

      handleMessage(streamer, {
        "display-name": "Random User" + userid,
        "username": "random-user-" + userid,
      }, "Hello from chat KEKW POG")
    }, 1000)
  }

  client.on("message", handleMessage);
  client.on("cheer", handleMessage);

  client.on("followersonly", (channel, enabled, length) => {
    if (enabled) {
      showAdminMessage({
        message: "Follower-Only Mode Enabled",
        attribs: { subtype: "followersonly" },
        timeout: 0,
      });
    } else {
      showAdminMessage({
        message: "Follower-Only Mode Disabled",
        attribs: { subtype: "nofollowersonly" },
        timeout: 1000,
      });

      removeAdminChatLine({ subtype: "followersonly" });
    }
  });

  client.on("join", (channel, username, self) => {
    if (!self) {
      return;
    }

    chatLog = JSON.parse(localStorage.getItem('log') || "[]") || { chat: [] }

    chatLog.chat.forEach(item => {
      if (parseInt(item?._sent) + 30_000 > new Date().getTime()) {
        showMessage(item);
      };
    });
  });

  client.on("part", (channel, username, self) => {
    if (!self) {
      return;
    }
    let chan = getChan(channel);
    delete bttvEmoteCache.data[chan];
    showAdminMessage({
      message: `Parted ${chan}`,
      timeout: 1000,
    });
  });

  client.on("clearchat", (channel) => {
    removeChatLine({ channel });
    showAdminMessage({
      message: "Chat was emptied.",
      timeout: 5000,
    });

    localStorage.setItem("log", JSON.stringify({
      chat: [],
      timestamp: Math.floor(new Date().getTime() / 1000)
    }));
  });

  client.on("raided", (channel, username, viewers) => {
    showAdminMessage({
      message: username + " raided us with " + viewers + " viewers!",
      timeout: 30000,
    });
  });

  client.on("timeout", (channel, username) => {
    removeChatLine({ channel, username });
  });
  client.on("messagedeleted", (channel, username, message, userstate) => {
    console.log(username, message, userstate);

    removeChatLine({ channel, username });
  });
}

function removeChatLine(params = {}) {
  if ("channel" in params) {
    params.channel = getChan(params.channel);
  }
  let search = Object.keys(params)
    .map((key) => `[${key}="${params[key]}"]`)
    .join("");
  chatEle.querySelectorAll(search).forEach((n) => chatEle.removeChild(n));

  chatLog.chat = chatLog.chat.filter(function (item) {
    if ("username" in params && item.data.username === params.username) {
      return false;
    }

    if ("channel" in params && item.chan === params.channel) {
      return false;
    }
    return true;
  })

  localStorage.setItem("log", JSON.stringify({
    chat: chatLog?.chat || [],
    timestamp: Math.floor(new Date().getTime() / 1000)
  }));
}

function removeAdminChatLine(params = {}) {
  params.type = "admin";
  removeChatLine(params);
}

function showAdminMessage(opts) {
  opts.type = "admin";
  if ("attribs" in opts === false) {
    opts.attribs = {};
  }
  opts.attribs.type = "admin";
  return showMessage(opts);
}

function getChan(channel = "") {
  return channel.replace(/^#/, "");
}

function showMessage({
  chan,
  type,
  message = "",
  data = {},
  timeout = 3000,
  attribs = {},
} = {}) {
  let chatLine_ = document.createElement("div");
  let chatLine = document.createElement("div");
  chatLine_.classList.add("chat-line");
  chatLine.classList.add("chat-line-inner");
  chatLine_.appendChild(chatLine);

  if (chan) {
    chatLine_.setAttribute("channel", chan);
  }

  Object.keys(attribs).forEach((key) => {
    chatLine_.setAttribute(key, attribs[key]);
  });

  if (type === "chat") {
    "id" in data && chatLine_.setAttribute("message-id", data.id);
    "user-id" in data && chatLine_.setAttribute("user-id", data["user-id"]);
    "room-id" in data && chatLine_.setAttribute("channel-id", data["room-id"]);
    "username" in data && chatLine_.setAttribute("username", data.username);

    let spaceEle = document.createElement("span");
    spaceEle.innerText = " ";
    let badgeEle = document.createElement("span");
    console.log(data);
    if ("badges" in data && data.badges !== null) {
      badgeEle.classList.add("badges");
      let badgeGroup = Object.assign(
        {},
        twitchBadgeCache.data.global,
        twitchBadgeCache.data[chan] || {}
      );
      let badges = Object.keys(data.badges).forEach((type) => {
        let version = data.badges[type];
        let badge = badgeGroup[type + "/" + version];
        if (badge) {
          let url = badge.icon;
          let ele = document.createElement("img");
          ele.setAttribute("src", url);
          ele.setAttribute("badgeType", type);
          ele.setAttribute("alt", type);
          ele.classList.add("badge");
          badgeEle.appendChild(ele);
        } else {
          console.log(type + " badge was not found.");
        }
      }, []);

      console.log(badges);
    }

    let nameEle = document.createElement("span");
    nameEle.classList.add("user-name");
    nameEle.innerText = data["display-name"];
    nameEle.style.color = data["color"];

    let colonEle = document.createElement("span");
    colonEle.classList.add("message-colon");
    colonEle.innerText = ": ";

    let messageEle = document.createElement("span");
    messageEle.classList.add("message");

    let finalMessage = handleEmotes(chan, data.emotes || {}, message);
    addEmoteDOM(messageEle, finalMessage);

    chatLine.appendChild(badgeEle);
    chatLine.appendChild(spaceEle);
    chatLine.appendChild(nameEle);
    chatLine.appendChild(colonEle);
    chatLine.appendChild(messageEle);
  } else if (type === "admin") {
    chatLine_.classList.add("admin");

    let messageEle = document.createElement("span");
    messageEle.classList.add("message");
    messageEle.innerText = message;

    chatLine.appendChild(messageEle);
  }


  chatEle.appendChild(chatLine_);


  setTimeout(() => {
    chatLine_.classList.add("visible")
    requiresScrolling = 100;
  }, 100);

  if (chatEle.childElementCount > 30) {
    chatEle.removeChild(chatEle.children[0]);
    scrollToBottom()
  }

  if (timeout && (timeoutItems || type === "admin")) {
    setTimeout(() => {
      if (chatLine_.parentElement) {
        chatLine_.classList.remove("visible");
        setTimeout(() => chatEle.removeChild(chatLine_), 1000);
      }
    }, timeout);
  }
}

function handleEmotes(channel, emotes, message) {
  // let messageParts = message.split(' ');
  let bttvEmotes = bttvEmoteCache.data.global.slice(0);
  if (channel in bttvEmoteCache.data) {
    bttvEmotes = bttvEmotes.concat(bttvEmoteCache.data[channel]);
  }
  let twitchEmoteKeys = Object.keys(emotes);
  let allEmotes = twitchEmoteKeys.reduce((p, id) => {
    let emoteData = emotes[id].map((n) => {
      let [a, b] = n.split("-");
      let start = +a;
      let end = +b + 1;
      return {
        start,
        end,
        id,
        code: message.slice(start, end),
        type: ["twitch", "emote"],
      };
    });
    return p.concat(emoteData);
  }, []);
  bttvEmotes.forEach(({ code, id, type, imageType }) => {
    let hasEmote = message.indexOf(code);
    if (hasEmote === -1) {
      return;
    }
    for (
      let start = message.indexOf(code);
      start > -1;
      start = message.indexOf(code, start + 1)
    ) {
      let end = start + code.length;
      allEmotes.push({ start, end, id, code, type });
    }
  });
  let seen = [];
  allEmotes = allEmotes
    .sort((a, b) => a.start - b.start)
    .filter(({ start, end }) => {
      if (seen.length && !seen.every((n) => start > n.end)) {
        return false;
      }
      seen.push({ start, end });
      return true;
    });
  if (allEmotes.length) {
    let finalMessage = [message.slice(0, allEmotes[0].start)];
    allEmotes.forEach((n, i) => {
      let p = Object.assign({}, n, { i });
      let { end } = p;
      finalMessage.push(p);
      if (i === allEmotes.length - 1) {
        finalMessage.push(message.slice(end));
      } else {
        finalMessage.push(message.slice(end, allEmotes[i + 1].start));
      }
      finalMessage = finalMessage.filter((n) => n);
    });
    return finalMessage;
  }
  return [message];
}

function addEmoteDOM(ele, data) {
  data.forEach((n) => {
    let out = null;
    if (typeof n === "string") {
      out = document.createTextNode(n);
    } else {
      let {
        type: [type, subtype],
        code,
      } = n;
      if (type === "twitch") {
        if (subtype === "emote") {
          out = document.createElement("img");
          out.setAttribute(
            "src",
            `https://static-cdn.jtvnw.net/emoticons/v1/${n.id}/1.0`
          );
          out.setAttribute("alt", code);
          out.classList.add("emote-" + code)
          out.classList.add("emote");
          out.classList.add("twitch-emote");
        }
      } else if (type === "bttv") {
        out = document.createElement("img");
        let url = bttvEmoteCache.urlTemplate;
        url = url.replace("{{id}}", n.id).replace("{{image}}", "1x");
        out.setAttribute("src", "https:" + url);
        out.classList.add("emote");
        out.classList.add("bttv-emote");
      }
    }

    if (out) {
      ele.appendChild(out);
    }
  });
  //wemoji.parse(ele);
}

function formQuerystring(qs = {}) {
  return Object.keys(qs)
    .map((key) => `${key}=${qs[key]}`)
    .join("&");
}

function request({
  base = "",
  endpoint = "",
  qs,
  headers = {},
  method = "get",
}) {
  let opts = {
    method,
    headers: new Headers(headers),
  };

  return fetch(base + endpoint + "?" + formQuerystring(qs), opts).then((res) =>
    res.json()
  );
}

function kraken(opts) {
  let defaults = {
    base: krakenBase,
    headers: {
      "Client-ID": krakenClientID,
      Accept: "application/vnd.twitchtv.v5+json",
    },
  };

  return request(Object.assign(defaults, opts));
}

async function twitchNameToUser(username) {
  let user = await kraken({
    endpoint: "users",
    qs: { login: username },
  }).then(({ users }) => users[0] || null);

  console.log(user);
  return user;
}

function getBadges(channel) {
  return fetch("api/badges.php")
    .then(response => {
      return response.json()
    })
}

function getClip(clipSlug) {
  return kraken({
    endpoint: `clips/${clipSlug}`,
  });
}

function getBTTVEmotes(channel) {
  // Get default emotes by default
  let endpoint = "/cached/emotes/global";
  let global = true;

  // Else, search for current
  if (channel) {
    endpoint = `/cached/users/twitch/${channel}`;
    global = false;
  }

  return request({
    base: "https://api.betterttv.net/3",
    endpoint,
  })
    .then((emotes) => {
      emotes.forEach((n) => {
        n.type = ["bttv", "emote"];

        // This is global emotes set
        if (global) {
          bttvEmoteCache.data.global.push(n);
          return;
        }

        // Make array of emotes for current channel if not exist
        if (!channel in bttvEmoteCache.data) {
          bttvEmoteCache.data[channel] = [];
        }

        // Finally push it
        bttvEmoteCache.data[channel].push(n);
      });
    })
    .catch((reason) => console.error(reason));
}

function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function luminance(r, g, b) {
  var a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
