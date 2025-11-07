class ExecutionService {
  static async executeWrapperRequest(wrapperRequest) {
    const numRetries = wrapperRequest.retryAttempts;
    let attempts = 0;
    while (attempts <= numRetries) {
      try {
        const response = await ExecutionService.fetchWithTimeout(
          wrapperRequest
        );
        if (response.aborted) {
          attempts++;
        } else if (!response.success) {
          return {
            success: false,
            data: null,
            errors: [
              `Wrapper request failed with error ${response.errors.join(', ')}`,
            ],
          };
        } else {
          return { success: true, data: response.data, errors: [] };
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

  static async fetchWithTimeout(wrapperRequest) {
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
      if (!response.ok) {
        const errorText = await response.text();
        return {
          aborted: false,
          success: false,
          errors: [
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          ],
        };
      }
      return { ...(await response.json()), aborted: false };
    } catch (error) {
      clearTimeout(timeoutId);
      return { aborted: true, success: false, errors: [error.message] };
    }
  }
}

module.exports = ExecutionService;
