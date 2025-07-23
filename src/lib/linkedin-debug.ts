/**
 * LinkedIn Debug Utility
 * Test different approaches to LinkedIn profile access
 */

export async function debugLinkedInAccess(profileUrl: string) {
  console.log('🔍 Debug LinkedIn access for:', profileUrl);

  const results = {
    basicFetch: null as Record<string, unknown> | null,
    withHeaders: null as Record<string, unknown> | null,
    differentUserAgent: null as Record<string, unknown> | null,
    mobileUserAgent: null as Record<string, unknown> | null,
  };

  // Test 1: Basic fetch
  try {
    const response = await fetch(profileUrl);
    const text = await response.text();
    results.basicFetch = {
      status: response.status,
      hasAuthwall: text.includes('authwall'),
      hasSignIn: text.includes('Sign In'),
      hasProfileData: text.includes('firstName') || text.includes('lastName'),
      contentLength: text.length,
      title: extractTitle(text),
    };
  } catch (error) {
    results.basicFetch = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 2: With realistic headers
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });
    const text = await response.text();
    results.withHeaders = {
      status: response.status,
      hasAuthwall: text.includes('authwall'),
      hasSignIn: text.includes('Sign In'),
      hasProfileData: text.includes('firstName') || text.includes('lastName'),
      contentLength: text.length,
      title: extractTitle(text),
    };
  } catch (error) {
    results.withHeaders = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 3: Different User Agent (older Chrome)
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    const text = await response.text();
    results.differentUserAgent = {
      status: response.status,
      hasAuthwall: text.includes('authwall'),
      hasSignIn: text.includes('Sign In'),
      hasProfileData: text.includes('firstName') || text.includes('lastName'),
      contentLength: text.length,
      title: extractTitle(text),
    };
  } catch (error) {
    results.differentUserAgent = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 4: Mobile User Agent
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      },
    });
    const text = await response.text();
    results.mobileUserAgent = {
      status: response.status,
      hasAuthwall: text.includes('authwall'),
      hasSignIn: text.includes('Sign In'),
      hasProfileData: text.includes('firstName') || text.includes('lastName'),
      contentLength: text.length,
      title: extractTitle(text),
    };
  } catch (error) {
    results.mobileUserAgent = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return results;
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'No title found';
}

/**
 * Check if a LinkedIn profile URL is publicly accessible
 */
export async function checkLinkedInProfileAccess(profileUrl: string): Promise<{
  isAccessible: boolean;
  reason: string;
  suggestions: string[];
}> {
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const text = await response.text();

    if (text.includes('authwall')) {
      return {
        isAccessible: false,
        reason: 'LinkedIn authwall detected - profile requires login to view',
        suggestions: [
          'Ask the user to set their LinkedIn profile to public',
          "Use LinkedIn's public profile URL format",
          'Consider using LinkedIn API with proper authentication',
        ],
      };
    }

    if (text.includes('Sign In') || text.includes('Join LinkedIn')) {
      return {
        isAccessible: false,
        reason: 'Profile redirects to login page',
        suggestions: [
          'Profile may be private or restricted',
          'LinkedIn may be blocking automated access',
          "Try accessing the profile manually to verify it's public",
        ],
      };
    }

    if (response.status !== 200) {
      return {
        isAccessible: false,
        reason: `HTTP ${response.status} - ${response.statusText}`,
        suggestions: [
          'Check if the profile URL is correct',
          'Profile may have been deleted or moved',
        ],
      };
    }

    // Check if we have any profile data
    const hasProfileData =
      text.includes('firstName') ||
      text.includes('lastName') ||
      text.includes('"name":') ||
      text.includes('headline');

    if (!hasProfileData) {
      return {
        isAccessible: false,
        reason: 'Profile loads but contains no extractable data',
        suggestions: [
          'Profile may be heavily restricted',
          'LinkedIn may be serving a minimal version to bots',
          'Consider using browser automation with session handling',
        ],
      };
    }

    return {
      isAccessible: true,
      reason: 'Profile appears to be publicly accessible',
      suggestions: [],
    };
  } catch (error) {
    return {
      isAccessible: false,
      reason: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestions: [
        'Check internet connection',
        'LinkedIn may be blocking the request',
        'Try again later',
      ],
    };
  }
}
