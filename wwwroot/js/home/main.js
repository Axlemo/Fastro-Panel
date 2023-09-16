let logout = false;

function progress(parent = "body", card = false) {
    const loader = $(`<div class="loading-container"><div><div class="mdl-spinner ${card ? "mdl-spinner-card" : ""} mdl-js-spinner is-active"></div></div></div>`);
    loader.appendTo(parent);
    loader.busy = true;

    componentHandler.upgradeElements($(".mdl-spinner").get());

    setTimeout(function () {
        loader.css({ opacity: 1 });
    }, 1);

    return {
        show: () => {
            loader.busy = true;
            loader.show();
            loader.css({ opacity: 1 });
        },
        hide: () => {
            loader.css({ opacity: 0 });

            setTimeout(function () {
                loader.hide();
                loader.busy = false;
            }, 400);
        },
        get busy() {
            return loader.busy;
        },
    };
}

function snackbar(message, timeout = 2000) {
    const toast = document.querySelector("#action-toast");
    toast.MaterialSnackbar.cleanup_();

    setTimeout(() => {
        toast.MaterialSnackbar.skipClearing++;
        toast.MaterialSnackbar.showSnackbar({ message: message, timeout: timeout });
    }, toast.MaterialSnackbar.Constant_.ANIMATION_LENGTH);
}

$("#change-pwd").click(async () => {
    Swal.fire({
        title: "Change your password",
        html: `<input id="swal-input1" class="swal2-input" placeholder="Current password" type="password">` +
            `<input id="swal-input2" class="swal2-input" placeholder="New password" type="password">` +
            `<input id="swal-input3" class="swal2-input" placeholder="Confirm new password" type="password">`,
        showLoaderOnConfirm: true,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "Change",
        cancelButtonText: "Cancel",
        preConfirm: () => {
            return resource.api.auth.changePassword("PATCH", {
                "current_password": $("#swal-input1").val(),
                "new_password": $("#swal-input2").val(),
                "new_password_confirm": $("#swal-input3").val(),
            }).then(() => {
                Swal.fire({
                    icon: "success",
                    title: "Successfully changed password",
                });
            }).catch((e) => {
                Swal.showValidationMessage(e.responseText);
            });
        },
    }).then(async (result) => {
        if (!result.isConfirmed) return;
    });
});

$("#logout").click(async () => {
    if (logout) return;
    logout = true;

    snackbar("Logging out...");

    await resource.api.auth.logout();
    window.location.replace(resource.login);
});

resource.api.user.identity().then((data) => {
    $("#username-load").fadeOut();

    setTimeout(() => {
        $("#username").html(data.Username).fadeIn();
    }, 250);
});