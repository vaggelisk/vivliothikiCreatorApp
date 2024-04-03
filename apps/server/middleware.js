import {createServer} from "@vue-storefront/middleware";
import {integrations} from "./middleware.config.js";
import cors from "cors";

(async () => {
    const app = await createServer({ integrations });
    const host = process.argv[2] ?? "0.0.0.0";
    const port = process.argv[3] ?? 8181;
    const CORS_MIDDLEWARE_NAME = "corsMiddleware";

    const corsMiddleware = app._router.stack.find(
        (middleware) => middleware.name === CORS_MIDDLEWARE_NAME
    );

    corsMiddleware.handle = cors({
        origin: [
            "http://localhost:3000",
            ...(process.env.MIDDLEWARE_ALLOWED_ORIGINS?.split(",") ?? []),
        ],
        credentials: true,
    });

    app.listen(port, 'localhost', () => {
        console.log(`Middleware started: http://localhost:${port}`);
    });
})();
