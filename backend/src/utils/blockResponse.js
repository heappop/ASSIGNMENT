function successBlock(data, extra = {}) {
    return {
        status: "ok",
        fetchedAt: new Date().toISOString(),
        stale: false,
        data,
        ...extra
    };
}

function errorBlock(error, fallbackMessage = "upstream_failed") {
    const message = error?.message || fallbackMessage;

    return {
        status: error?.code === "TIMEOUT" ? "timeout" : "error",
        error: message,
        data: null
    };
}

module.exports = {
    successBlock,
    errorBlock
};
