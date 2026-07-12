const storageKey = "close-notice-internship-2027";
const notice = document.getElementById("global-notice");
const closeNoticeButton = document.getElementById("close-notice");

if (!window.location.pathname.includes("/blog/internship-2027")) {
    // Remove the display none by default
    notice.style = "";
}

function closeNotice() {
    notice.style = "display: none";
}

closeNoticeButton.onclick = () => {
    localStorage.setItem(storageKey, "true");
    closeNotice();
}

if (localStorage.getItem(storageKey) === "true") {
    closeNotice();
}
