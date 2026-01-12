const DEFAULT_REMOTE_API_BASE_URL = 'https://librarian-api.notia-evia.gr';
const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:4000';

export function getLibrarianApiBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_LIBRARIAN_API_BASE_URL?.trim();
  if (override && override.length > 0) {
    return override;
  }
  return process.env.NODE_ENV === 'production'
    ? DEFAULT_REMOTE_API_BASE_URL
    : DEFAULT_LOCAL_API_BASE_URL;
}
