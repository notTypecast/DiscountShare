
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const submitButton = document.getElementById("formSubmit");

const loginEndpoint = "/api/login";

setSubmitButton(submitButton);
setWarningLocation(submitButton);

usernameInput.addEventListener("keyup", () => {
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

submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    showLoader();
    const response = await sameOriginPostRequest(loginEndpoint, {
        "username": usernameInput.value,
        "password_b64": window.btoa(passwordInput.value)
    });

    let body = await response.json();

    hideLoader();
    if (response.status == 403) {
        makeToast("failure", body.error, 3000);
    } else if (response.status >= 200 && response.status < 300) {
        makeToast("success", "Successfully logged in!", 3000);
        document.cookie = "session_token=" + body.session_token+"; SameSite=Lax";
        window.location.href="/";
    } else {
        makeToast("failure", "Failed to log in!", 3000);
    }
});
