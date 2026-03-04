import { Octokit } from '@octokit/rest';
import { useAuthStore } from '@/stores/authStore';

let octokitInstance: Octokit | null = null;

export function getOctokit(): Octokit {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: token });
  }
  return octokitInstance;
}

// Reset instance on token change
useAuthStore.subscribe((state, prev) => {
  if (state.token !== prev.token) {
    octokitInstance = null;
  }
});
