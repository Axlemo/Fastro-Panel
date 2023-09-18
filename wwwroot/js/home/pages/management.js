const userLoad = progress("#user-list-card", true);
const sessionLoad = progress("#session-list-card", true);

async function deleteUser(id, name) {
    snackbar(`Deleting user: ${name}, please wait...`);
    userLoad.show();

    try {
        await resource.api.user.update("DELETE", { "user_id": id });
        $("ul").find(`[data-user-id="${id}"]`).remove();
        snackbar(`Successfully deleted user ${name}!`);
    }
    catch (e) {
        snackbar(e.responseText, 1500);
    }
    finally {
        userLoad.hide();
    }
}

async function toggleBlockUser(id, name, status) {
    snackbar(`${status ? "Blocking" : "Unblocking"} user: ${name}, please wait...`);
    userLoad.show();

    try {
        await resource.api.user.update("PATCH", { "user_id": id, "blocked": status });
        snackbar(`Successfully ${status ? "blocked" : "unblocked"} user ${name}!`);
        return true;
    }
    catch (e) {
        snackbar(e.responseText, 1500);
    }
    finally {
        userLoad.hide();
    }
}

async function loadUsers(identity) {
    const users = await resource.api.user.list();
    let delay = 50;

    userLoad.hide();

    users.forEach(function (user) {
        const clone = $("#ul-user").clone(), localuser = user.UserId === identity.UserId;
        clone.attr("data-user-id", user.UserId);
        clone.find("#ul-user-name").html(!localuser ? user.Username : `${user.Username} (you)`);

        const update = () => clone.find("#ul-user-btn-block-icon").html(`${user.Disabled ? "how_to_reg" : "block"}`);

        if (localuser || user.UserId === 1) {
            clone.find("#ul-user-btn-delete").attr("disabled", true);
            clone.find("#ul-user-btn-block").attr("disabled", true);
        }

        clone.find("#ul-user-btn-delete").click(async () => {
            if (userLoad.busy) return;
            await deleteUser(user.UserId, user.Username);
        });

        clone.find("#ul-user-btn-block").click(async () => {
            if (userLoad.busy) return;

            if (await toggleBlockUser(user.UserId, user.Username, !user.Disabled)) {
                user.Disabled = !user.Disabled;
                update();
            }
        });

        update();
        clone.hide();
        clone.appendTo("#user-list");

        setTimeout(() => {
            clone.fadeIn();
        }, delay);

        delay += 25;
    });
}

async function revokeSession(id) {
    snackbar(`Revoking session: ${id}, please wait...`);
    sessionLoad.show();

    try {
        await resource.api.session.revoke("POST", { "session_id": id });
        $("ul").find(`[data-session-id="${id}"]`).remove();
        return true;
    }
    catch (e) {
        snackbar(e.responseText, 1500);
    }
    finally {
        sessionLoad.hide();
    }
}

async function loadSessions(identity) {
    const sessions = await resource.api.session.list();
    let delay = 50;

    sessionLoad.hide();

    sessions.forEach(function (session) {
        const clone = $("#ul-session").clone(), localsession = session.SessionId === identity.SessionId;
        clone.attr("data-session-id", session.SessionId);
        clone.attr("title", session.RemoteAddress ?? "Unknown IP address");
        clone.find("#ul-session-name").html(!localsession ? session.Username : `${session.Username} (current)`);
        clone.find("#ul-session-creation").html(new Date(session.CreationDate).toLocaleString());

        if (session.UserId === 1 && session.UserId !== identity.UserId) {
            clone.find("#ul-session-btn-revoke").attr("disabled", true);
        }

        clone.find("#ul-session-btn-revoke").click(async () => {
            if (sessionLoad.busy) return;

            if (await revokeSession(session.SessionId)) {
                if (localsession) window.location.replace(resource.login);
            }
        });

        clone.hide();
        clone.appendTo("#session-list");

        setTimeout(() => {
            clone.fadeIn();
        }, delay);

        delay += 25;
    });
}

resource.api.user.identity().then((data) => {
    loadUsers(data);
    loadSessions(data);
});