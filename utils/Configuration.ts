export default abstract class Configuration {
    static Server = {
        DefaultPort: 1337,
        RouteDirectory: "system/http/routes",
    }

    static Router = {
        EnableDefaultRedirect: true,
        DefaultRoute: "login",
        APIDirectory: "/api/",
    }

    static Static = {
        EnableStaticFileServer: true,
        EnableClientCaching: true,
        VirtualDirectory: "/content/",
        PhysicalDirectory: "/wwwroot/",
        Integrated: {
            FileDirectory: "http/",
            ErrorFiles: {
                NotFound: "pages/errors/not-found.html",
                SvrError: "pages/errors/server-error.html",
                Unauthorized: "pages/errors/unauthorized.html",
            },
        },
    }

    static Websocket = {
        EnableWebsocket: false,
    }

    static Session = {
        CookieName: "__|SITE::SECURITY",
        CookieLength: 256,
        ValidityTime: 54e6,
        SpecialCharacters: false,
    }

    static Security = {
        AddSecurityHeaders: true,
    }
};