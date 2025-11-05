const LogManager = require('../managers/log-manager');

class CqlExecutionService {
  static async executeWrapperRequest(wrapperRequest) {
    const numRetries = wrapperRequest.retryAttempts;
    let attempts = 0;
    while (attempts <= numRetries) {
      try {
        const response = await fetchWithTimeout(wrapperRequest);
        if (response.aborted) {
          attempts++;
        } else if (!response.ok) {
          return {
            success: false,
            data: null,
            errors: [
              `Wrapper request failed with error ${response.errors.join(', ')}`,
            ],
          };
        } else {
          const data = await response.json();
          return { success: true, data: data, errors: [] };
        }
      } catch (error) {
        attempts++;
      }
    }
    return {
      success: false,
      data: null,
      errors: [`Maximum number of attempts reached`],
    };
  }

  async fetchWithTimeout(wrapperRequest) {
    const abortController = new AbortController();
    const signal = abortController.signal;
    const timeoutId = setTimeout(
      () => abortController.abort(),
      wrapperRequest.timeout
    );

    try {
      const response = await fetch(wrapperRequest.url, {
        method: wrapperRequest.method,
        headers: wrapperRequest.headers,
        body: JSON.stringify(wrapperRequest.body),
        signal: signal,
      });

      clearTimeout(timeoutId);
      return { ...response, aborted: false };
    } catch (error) {
      clearTimeout(timeoutId);
      return { aborted: true };
    }
  }
}

module.exports = CqlExecutionService;
