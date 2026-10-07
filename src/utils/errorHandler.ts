export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    const status = response?.status;

    if (status === 404) {
      return 'Requested resource was not found.';
    }

    if (status === 400) {
      return 'Invalid request.';
    }

    if (status === 401) {
      return 'Please login again.';
    }

    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (status === 500) {
      return 'Something went wrong on the server.';
    }
  }

  return 'Unable to connect to the server.';
}
