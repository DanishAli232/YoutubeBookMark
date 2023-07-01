(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            });
        });
    };

    const addNewBookmarkEventHandler = async() => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            desc: "Bookmark at " + getTime(currentTime),
        };
        // console.log(newBookmark);

        currentVideoBookmarks = await fetchBookmarks();

        chrome.storage.local.set({ key: newBookmark }, function() {
            console.log("Value is set to " + newBookmark);
        });

        chrome.storage.local.get(["key"], function(result) {
            console.log("Value currently is " + result.key);
        });

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify(
                [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
            ),
        });
    };

    const newVideoLoaded = async() => {
        const bookmarkBtnExists =
            document.getElementsByClassName("bookmark-btn")[0];
        console.log(bookmarkBtnExists);

        currentVideoBookmarks = await fetchBookmarks();

        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button " + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            youtubeLeftControls =
                document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];

            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    };

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type === "PLAY") {
            youtubePlayer.currentTime = value;
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter(
                (b) => b.time != value
            );
            chrome.storage.sync.set({
                [currentVideo]: JSON.stringify(currentVideoBookmarks),
            });

            response(currentVideoBookmarks);
        }
    });

    newVideoLoaded();
})();

const getTime = (t) => {
    var date = new Date(0);
    // date.setSeconds(t);
    date = Math.floor(t / 60) + ":" + ("0" + Math.floor(t % 60)).slice(-2);

    return date;
};