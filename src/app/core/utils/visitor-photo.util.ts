import { environment } from '../../../environments/environment';

export function getVisitorPhotoUrl(path?: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const apiRoot = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`;
}
