const query = new URLSearchParams(window.location.search);

const config = {
    api_base: "/api",
};

class Router {
    constructor(name, default_method = "GET") {
        this.name = `${config.api_base}/${name}/`;
        this.default_method = default_method;
    }

    name;

    default_method;

    route(route, alias, default_method = this.default_method) {
        if (this[alias] !== undefined) {
            console.error(`ERROR :: Router - invalid route name '${alias}'`);
            return this;
        }

        this[alias] = async (method = default_method, data) => {
            return await this.#handle(route, method, data);
        };

        return this;
    }

    async #handle(path, method, data) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.name + path,
                type: method,
                data: data && JSON.stringify(data),
                success: function (res) {
                    resolve(res);
                },
                error: function (xhr) {
                    reject(xhr);
                },
            });
        });
    }
}

const auth = new Router("auth", "POST")
    .route("validate-login", "validateLogin")
    .route("change-password", "changePassword")
    .route("register", "register")
    .route("logout", "logout");

const user = new Router("users")
    .route("list", "list")
    .route("update", "update")
    .route("identity", "identity");

const session = new Router("sessions")
    .route("list", "list")
    .route("revoke", "revoke");

window.resource = {
    login: "/login",
    api: { auth, user, session },
};