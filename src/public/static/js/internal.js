
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
    
    addSection(sectionTitle, sectionContent, overrideClasses) {
        let section = document.createElement("section");
        section.classList.add("page-section");
        if (this.title !== null) {
            let sectionTitleElement = document.createElement("h2");
            sectionTitleElement.classList.add("page-section-header");
            sectionTitleElement.innerText = sectionTitle;
            section.appendChild(sectionTitleElement);
        }

        if (overrideClasses) {
            for (let overrideClass of overrideClasses) {
                section.classList.add(overrideClass);
            }
        }

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

class TableCreator {
    constructor(cols) {
        this.cols = cols;
        this.tableWrap = document.createElement("div");
        this.tableWrap.classList.add("data-table-wrap");
        this.tableRoot = document.createElement("table");
        this.tableRoot.classList.add("data-table");

        let headerRow = document.createElement("tr");
        this.cols.forEach(col => {
            let newHeader = document.createElement("th");
            newHeader.innerHTML = col;
            headerRow.appendChild(newHeader);
        });

        this.tableRoot.appendChild(headerRow);
        this.tableWrap.appendChild(this.tableRoot);
    }

    getTable() {   
        return this.tableWrap;
    }

    appendRow(row) {
        let newtr = document.createElement("tr");
        row.forEach(cell => {
            let newtd = document.createElement("td");
            if (cell === null) {
                cell = `NA`;
            } 
            
            if (cell instanceof HTMLElement) {
                newtd.appendChild(cell);
            } else {
                newtd.innerHTML = cell;
            }
            newtr.appendChild(newtd);
        });
        this.tableRoot.appendChild(newtr);
    }
}

function createUploadForm(inputId, submitEvent) {

    let fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "text/*";
    fileInput.id = inputId;

    let fileLabel = document.createElement("label");
    fileLabel.innerText = "Browse...";
    fileLabel.classList.add("internal-form-file-label");
    fileLabel.htmlFor = inputId;

    let fileLabelIcon = document.createElement("span");
    fileLabelIcon.classList.add("material-icons");
    fileLabelIcon.innerText = "attach_file";
    fileLabel.prepend(fileLabelIcon);

    let selectedFile = document.createElement("span");
    selectedFile.classList.add("internal-form-file-selected");
    selectedFile.innerText = "No file selected";

    fileInput.addEventListener("change", () => {
        selectedFile.innerText = fileInput.files[0].name;
    });

    let fileInputForm = document.createElement("form");
    fileInputForm.classList.add("internal-form");
    fileInputForm.appendChild(fileLabel);
    fileInputForm.appendChild(selectedFile);
    fileInputForm.appendChild(fileInput);
    let fileInputSubmit = document.createElement("button");
    fileInputSubmit.innerText = "Upload";
    fileInputSubmit.classList.add("internal-form-submit");
    fileInputSubmit.addEventListener("click",submitEvent);
    fileInputForm.appendChild(fileInputSubmit);

    return fileInputForm;
}