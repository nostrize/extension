// import { buildApp } from '../../imgui-dom/src/html'
import { logger } from './helpers/logger'

const log = logger({ 
  state: { 
    debug: true 
  } 
});

const pathParts = window.location.pathname.split('/')
.filter(part => part.length > 0);

// Assuming the URL pattern is https://github.com/{user}/{repo}/issues
if (pathParts.length < 3 || pathParts[2] !== 'issues') {
  throw new Error('Unexpected content script issues, or github URL mismatch')
}

const user = pathParts[0];
const repo = pathParts[1];
log(`User: ${user}, Repo: ${repo}`);

// buildApp({
//   appId: "",
//   children: []
// });

// iterate over issue links (eg: id=issue_2_link)
document.querySelectorAll('a[id^="issue_"][id$="_link"]').forEach(function(a) {
  const issueId = a.id.split('issue_')[1].split('_')[0];
  log(`issue ${issueId}`);
});
