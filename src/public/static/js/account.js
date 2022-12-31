const changeUsernameInput = document.getElementById("changeUsernameInput");
const changeUsernameBtn = document.getElementById("changeUsernameBtn");
const changePasswordInput = document.getElementById("changePasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const changePasswordBtn = document.getElementById("changePasswordBtn");

let changeUsernameInjected = {
    btn: changeUsernameBtn,
    input: changeUsernameInput
};

let changePasswordInjected = {
    btn: changePasswordBtn,
    input: changePasswordInput
};

setWarningLocation(changeUsernameInjected.btn, changeUsernameInjected);

changeUsernameInput.addEventListener("keyup", (e) => {
    const text = e.target.value;

    removeWarnings(e.target, changeUsernameInjected);

    if (text.length == 0) {
        return;
    }

    if (text.length < 2) {
        addWarning(e.target, "Username should be longer than 1 character.", changeUsernameInjected);        
    }

    if (text.length > 24) {
        addWarning(e.target, "Username should not be longer than 24 characters.", changeUsernameInjected);
    }

    if (!/^[A-Za-z0-9]+$/.test(text)) {
        addWarning(e.target, "Username should only contain letters and digits.", changeUsernameInjected);
    }
});


setWarningLocation(changePasswordInjected.btn, changePasswordInjected);

changePasswordInput.addEventListener("keyup", (e) => {
    const text = e.target.value;

    removeWarnings(e.target, changePasswordInjected);

    confirmPasswordEventListener();

    if (text.length == 0) {
        return;
    }

    if (text.length < 8) {
        addWarning(e.target, "Password should be 8 characters or longer.", changePasswordInjected);
    }

    if (!/[A-Z]/.test(text)) {
        addWarning(e.target, "Password must contain at least 1 uppercase letter.", changePasswordInjected);
    }

    if (!/[0-9]/.test(text)) {
        addWarning(e.target, "Password must contain at least 1 digit.", changePasswordInjected);
    }

    if (!/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\[\]\{\}\|\\\;\:\'\"\,\<\>\,\.\?\/]/.test(text)) {
        addWarning(e.target, "Password must contain at least 1 symbol.", changePasswordInjected);
    }
});

function confirmPasswordEventListener() {
    const text = confirmPasswordInput.value;

    removeWarnings(confirmPasswordInput, changePasswordInjected);

    if (text.length == 0) {
        return;
    }

    password = changePasswordInput.value;

    if (text !== password) {
        addWarning(confirmPasswordInput, "Passwords do not match.", changePasswordInjected);
    }
}

confirmPasswordInput.addEventListener("keyup", confirmPasswordEventListener);