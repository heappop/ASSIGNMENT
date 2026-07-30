/**
 * Application Entry Point
 * Binds the Express server to 0.0.0.0 so cloud platforms (Render, Railway, AWS)
 * can properly route external traffic to the designated PORT.
 */

const app = require("./app");
const { PORT } = require("./config/env");

// Bind explicitly to 0.0.0.0 to resolve cloud hosting port-scan discovery
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening directly on http://0.0.0.0:${PORT}`);
});