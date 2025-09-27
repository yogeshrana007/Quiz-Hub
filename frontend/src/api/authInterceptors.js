export default function setupAuthInterceptors(
    api,
    { setAccessToken, onRefreshFail }
) {
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach((p) =>
            error ? p.reject(error) : p.resolve(token)
        );
        failedQueue = [];
    };

    // request - attach latest token from localStorage (simple & reliable)
    api.interceptors.request.use(
        (config) => {
            const tok = localStorage.getItem("accessToken");
            if (tok) config.headers.Authorization = `Bearer ${tok}`;
            return config;
        },
        (err) => Promise.reject(err)
    );

    // response - catch 401 token expired
    api.interceptors.response.use(
        (res) => res,
        (error) => {
            const originalRequest = error.config;
            const status = error.response?.status;
            const serverErr = error.response?.data?.error || "";

            if (!originalRequest || originalRequest._retry)
                return Promise.reject(error);

            // detect token expired (server sends "Token expired" message)
            if (status === 401 && /token/i.test(serverErr)) {
                if (isRefreshing) {
                    // queue the request
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return api(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                return new Promise(async (resolve, reject) => {
                    try {
                        // make refresh call using the same axios instance (api) so baseURL + withCredentials used
                        const r = await api.get("/api/auth/refresh", {
                            withCredentials: true,
                        });
                        const newToken = r.data.accessToken;

                        // update storage & app state
                        localStorage.setItem("accessToken", newToken);
                        setAccessToken(newToken);

                        processQueue(null, newToken);

                        // retry original
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    } catch (err) {
                        processQueue(err, null);
                        // refresh failed -> call app logout handler
                        try {
                            onRefreshFail && onRefreshFail();
                        } catch (e) {}
                        reject(err);
                    } finally {
                        isRefreshing = false;
                    }
                });
            }

            return Promise.reject(error);
        }
    );
}
