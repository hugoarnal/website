const codeBlocks = document.querySelectorAll("code");

function copyCodeContent(codeBlock) {
    navigator.clipboard.writeText(codeBlock.innerText);
}

function createCopyButton() {
    let copyButton = document.createElement("button");

    copyButton.className = "styled-button hover-bg-white copy-button";
    copyButton.textContent = "Copy";
    return copyButton;
}

codeBlocks.forEach((codeBlock) => {
    let copyButton = createCopyButton();

    copyButton.onclick = () => {
        copyCodeContent(codeBlock);
    }
    codeBlock.parentElement.prepend(copyButton);
});
