// Register your OAuth App at: https://github.com/settings/applications/new
// - Application name: GitMob
// - Homepage URL: https://github.com/your-username/gitmob
// - Authorization callback URL: (not needed for Device Flow)
// - Enable Device Flow in the app settings
export const GITHUB_CLIENT_ID = 'Ov23liChg0UNFFMZmQri';

export const GITHUB_SCOPES = ['repo', 'user', 'read:org', 'read:discussion'] as const;
