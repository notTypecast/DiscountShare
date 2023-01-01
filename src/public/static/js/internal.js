
function disableHold(onHold) {
    for (let i = 0; i < onHold.length; i++) {
        elements = document.getElementsByClassName(onHold[i]);
        for (let j = 0; j < elements.length; j++) {
            elements[j].classList.add("not-on-hold");
        }
    }
}

function getUsernameFromToken() {
    const token = readCookies()["session_token"];
    const payload = token.split(".")[1];
    const decodedPayload = atob(payload);
    const username = JSON.parse(decodedPayload).username;

    return username;
}

class MainViewFactory {
    constructor(parentNode) {
        this.sections = [];
        this.parentNode = parentNode;
    }

    setTitle(newTitle) {
        this.title = newTitle;
    }
    
    addSection(sectionTitle, sectionContent) {
        let section = document.createElement("section");
        section.classList.add("page-section");
        let sectionTitleElement = document.createElement("h2");
        sectionTitleElement.classList.add("page-section-header");
        sectionTitleElement.innerText = sectionTitle;
        section.appendChild(sectionTitleElement);
        section.appendChild(sectionContent);

        this.sections.push(section);
    }

    displaySections() {
        let header = document.createElement("h1");
        header.innerText = this.title;
        header.classList.add("page-title");
        this.parentNode.appendChild(header);
        for (let section of this.sections) {
            this.parentNode.appendChild(section);
        }
    }

    setTitleDOM(newTitle) {
        this.parentNode.querySelector(".page-title").innerText = newTitle;
    }

    clearSections() {
        for (let section of this.sections) {
            section.remove();
        }
        this.sections.length = 0;
    }

    clear() {
        this.title = "";
        this.parentNode.innerHTML = "";
        this.clearSections();
    }
}


const mainView = new MainViewFactory(document.querySelector("main"));