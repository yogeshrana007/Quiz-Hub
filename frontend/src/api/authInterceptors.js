export default function setupAuthInterceptors(
    api,
    { getAccessToken, setAccessToken, onRefreshFail } = {}
) {
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach((p) =>
            error ? p.reject(error) : p.resolve(token)
        );
        failedQueue = [];
    };

    // request - attach latest token from getAccessToken or localStorage
    api.interceptors.request.use(
        (config) => {
            const tok =
                getAccessToken?.() || localStorage.getItem("accessToken");
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

            if (status === 401 && /token/i.test(serverErr)) {
                if (isRefreshing) {
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
                        const r = await api.get("/api/auth/refresh", {
                            withCredentials: true,
                        });
                        const newToken = r.data.accessToken;

                        localStorage.setItem("accessToken", newToken);
                        setAccessToken?.(newToken);

                        processQueue(null, newToken);

                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    } catch (err) {
                        processQueue(err, null);
                        onRefreshFail?.();
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
