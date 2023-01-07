const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+)+$/;

const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const submitButton = document.getElementById("formSubmit");

const registerEndpoint = "/api/register";

setSubmitButton(submitButton);
setWarningLocation(submitButton);

function confirmPasswordEventListener() {
    const text = confirmPasswordInput.value;

    removeWarnings(confirmPasswordInput);

    if (text.length == 0) {
        return;
    }

    password = passwordInput.value;

    if (text !== password) {
        addWarning(confirmPasswordInput, "Passwords do not match.");
    }
}

usernameInput.addEventListener("input", () => {
    const text = usernameInput.value;

    removeWarnings(usernameInput);

    if (text.length == 0) {
        return;
    }

    if (text.length < 2) {
        addWarning(usernameInput, "Username should be longer than 1 character.");        
    }

    if (text.length > 24) {
        addWarning(usernameInput, "Username should not be longer than 24 characters.");
    }

    if (!/^[A-Za-z0-9]+$/.test(text)) {
        addWarning(usernameInput, "Username should only contain letters and digits.");
    }
});

emailInput.addEventListener("input", () => {
    const text = emailInput.value;

    removeWarnings(emailInput);

    if (text.length == 0) {
        return;
    }

    if (!emailRegex.test(text)) {
        addWarning(emailInput, "E-mail address is invalid.");
    }
});

passwordInput.addEventListener("input", () => {
    const text = passwordInput.value;

    removeWarnings(passwordInput);

    confirmPasswordEventListener();

    if (text.length == 0) {
        return;
    }

    if (text.length < 8) {
        addWarning(passwordInput, "Password should be 8 characters or longer.");
    }

    if (!/[A-Z]/.test(text)) {
        addWarning(passwordInput, "Password must contain at least 1 uppercase letter.");
    }

    if (!/[0-9]/.test(text)) {
        addWarning(passwordInput, "Password must contain at least 1 digit.");
    }

    if (!/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\[\]\{\}\|\\\;\:\'\"\,\<\>\,\.\?\/]/.test(text)) {
        addWarning(passwordInput, "Password must contain at least 1 symbol.");
    }
});

confirmPasswordInput.addEventListener("input", confirmPasswordEventListener);

submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    if (usernameInput.value.length == 0) {
        addWarning(usernameInput, "Username cannot be empty.");
        return;
    }

    if (emailInput.value.length == 0) {
        addWarning(emailInput, "E-mail cannot be empty.");
        return;
    }

    if (passwordInput.value.length == 0) {
        addWarning(passwordInput, "Password cannot be empty.");
        return;
    }

    if (confirmPasswordInput.value !== passwordInput.value) {
        addWarning(confirmPasswordInput, "Passwords do not match.");
        return;
    }


    showLoader();
    const response = await sameOriginPostRequest(registerEndpoint, {
        "username": usernameInput.value,
        "password_b64": window.btoa(passwordInput.value),
        "email": emailInput.value
    });

    const body = await response.json();
    hideLoader();

    if (response.status >= 400) {
        makeToast("failure", body.error, 3000);
    }
    else if (response.status >= 200 && response.status < 300) {
        makeToast("success", "Successfully registered user!", 3000);
        document.cookie = "session_token=" + body.session_token+"; SameSite=Lax";
        window.location.href="/";
    }
});
