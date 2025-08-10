/**
 * Profile Intelligence Module
 * Generates smart recommendations and auto-fills profile fields based on CV data
 */

export interface SmartProfileData {
  professional_headline: string;
  bio: string;
  skills_recommendation?: string[];
  sectors_recommendation?: string[];
}

/**
 * Generate a professional headline from CV data
 */
export function generateProfessionalHeadline(cvData: any): string {
  // Check for existing headline/title
  if (cvData.professional_headline) return cvData.professional_headline;
  if (cvData.title) return cvData.title;

  // Generate from current role
  if (cvData.currentRole && cvData.currentCompany) {
    return `${cvData.currentRole} at ${cvData.currentCompany}`;
  }

  // Generate from most recent work experience
  if (cvData.workHistory?.length > 0) {
    const currentJob =
      cvData.workHistory.find((job: any) => job.is_current) ||
      cvData.workHistory[0];
    if (currentJob) {
      const title = currentJob.title || currentJob.position;
      const company = currentJob.company;

      if (title && company) {
        return currentJob.is_current
          ? `${title} at ${company}`
          : `${title} | Former ${company}`;
      }
      if (title) return title;
    }
  }

  // Generate from board experience if no work history
  if (cvData.boardExperience?.length > 0) {
    const currentBoard =
      cvData.boardExperience.find((board: any) => board.is_current) ||
      cvData.boardExperience[0];
    if (currentBoard) {
      return `${currentBoard.role} at ${currentBoard.organization}`;
    }
  }

  // Fallback to education-based headline
  if (cvData.education?.length > 0) {
    const degree = cvData.education[0].degree;
    const field = cvData.education[0].field;
    if (degree) {
      return field ? `${degree} in ${field}` : degree;
    }
  }

  return 'Professional';
}

/**
 * Generate an intelligent professional bio from CV data
 */
export function generateSmartBio(cvData: any): string {
  // If we already have a professional bio from CV, use it
  if (cvData.professionalBio && cvData.professionalBio.trim().length > 50) {
    return cvData.professionalBio.trim();
  }

  const name = cvData.firstName || cvData.first_name || 'The candidate';
  const headline = generateProfessionalHeadline(cvData);

  let bio = `${name} is a ${headline.toLowerCase()}`;

  // Add experience summary
  if (cvData.workHistory?.length > 0) {
    const yearsOfExperience = calculateYearsOfExperience(cvData.workHistory);
    if (yearsOfExperience > 0) {
      bio += ` with ${yearsOfExperience}+ years of experience`;
    }

    // Add key achievements or description from current/recent role
    const currentJob =
      cvData.workHistory.find((job: any) => job.is_current) ||
      cvData.workHistory[0];
    if (currentJob?.key_achievements?.length > 0) {
      bio += `. Key achievements include ${currentJob.key_achievements[0].toLowerCase()}`;
    } else if (currentJob?.description) {
      // Extract first significant achievement from description
      const achievement = extractKeyAchievement(currentJob.description);
      if (achievement) {
        bio += `. ${achievement}`;
      }
    }
  }

  // Add board experience
  if (cvData.boardExperience?.length > 0) {
    bio += `. ${name} has served on ${cvData.boardExperience.length} board${cvData.boardExperience.length > 1 ? 's' : ''}`;
    const currentBoards = cvData.boardExperience.filter(
      (b: any) => b.is_current
    );
    if (currentBoards.length > 0) {
      bio += `, currently serving as ${currentBoards[0].role} at ${currentBoards[0].organization}`;
    }
  }

  // Add education highlight
  if (cvData.education?.length > 0) {
    const topEducation = cvData.education[0];
    if (topEducation.degree && topEducation.institution) {
      bio += `. ${name} holds a ${topEducation.degree} from ${topEducation.institution}`;
      if (topEducation.honors) {
        bio += ` (${topEducation.honors})`;
      }
    }
  }

  // Add skills summary
  if (cvData.skills?.length > 3) {
    const topSkills = cvData.skills.slice(0, 3).join(', ');
    bio += `. Core competencies include ${topSkills}`;
  }

  bio += '.';

  // Ensure bio is not too long
  if (bio.length > 500) {
    // Truncate intelligently at sentence boundary
    const sentences = bio.split('. ');
    let truncatedBio = '';
    for (const sentence of sentences) {
      if (truncatedBio.length + sentence.length < 480) {
        truncatedBio += sentence + '. ';
      } else {
        break;
      }
    }
    bio = truncatedBio.trim();
  }

  return bio;
}

/**
 * Generate smart sector recommendations based on work and board experience
 */
export function generateSectorRecommendations(cvData: any): string[] {
  const sectors = new Set<string>();

  // Extract from work history
  if (cvData.workHistory?.length > 0) {
    cvData.workHistory.forEach((job: any) => {
      const company = job.company?.toLowerCase() || '';

      // Technology sector indicators
      if (
        company.includes('amazon') ||
        company.includes('google') ||
        company.includes('microsoft') ||
        company.includes('software') ||
        company.includes('tech') ||
        job.title?.toLowerCase().includes('engineer')
      ) {
        sectors.add('Technology');
      }

      // Finance sector indicators
      if (
        company.includes('bank') ||
        company.includes('capital') ||
        company.includes('finance') ||
        company.includes('investment') ||
        job.title?.toLowerCase().includes('financial')
      ) {
        sectors.add('Finance');
      }

      // Healthcare sector indicators
      if (
        company.includes('health') ||
        company.includes('medical') ||
        company.includes('pharma') ||
        company.includes('hospital')
      ) {
        sectors.add('Healthcare');
      }

      // Education sector indicators
      if (
        company.includes('university') ||
        company.includes('college') ||
        company.includes('school') ||
        job.title?.toLowerCase().includes('professor') ||
        job.title?.toLowerCase().includes('teacher')
      ) {
        sectors.add('Education');
      }

      // Consulting indicators
      if (
        company.includes('consulting') ||
        company.includes('advisory') ||
        job.title?.toLowerCase().includes('consultant')
      ) {
        sectors.add('Consulting');
      }
    });
  }

  // Extract from board experience
  if (cvData.boardExperience?.length > 0) {
    cvData.boardExperience.forEach((board: any) => {
      if (board.sector) {
        sectors.add(board.sector);
      }
    });
  }

  // Add sectors from CV if available
  if (cvData.sectors?.length > 0) {
    cvData.sectors.forEach((sector: string) => sectors.add(sector));
  }

  return Array.from(sectors);
}

/**
 * Generate enhanced questions that show we understand the user
 */
export function generateIntelligentQuestions(
  cvData: any,
  missingFields: any[]
): string[] {
  const questions: string[] = [];
  const name = cvData.firstName || cvData.first_name || 'there';
  const headline = generateProfessionalHeadline(cvData);

  missingFields.forEach((field) => {
    switch (field.field) {
      case 'professional_headline':
        // Don't ask - we generated it
        break;

      case 'bio':
        // Offer our generated bio as a starting point
        questions.push(
          `I've drafted a professional summary based on your CV: "${generateSmartBio(cvData).substring(0, 100)}..." Would you like me to use this, or would you prefer to describe yourself differently?`
        );
        break;

      case 'skills':
        // Make intelligent suggestions based on role
        const suggestedSkills = generateSkillSuggestions(cvData);
        if (suggestedSkills.length > 0) {
          questions.push(
            `Based on your experience as ${headline}, I'd suggest highlighting skills like ${suggestedSkills.slice(0, 3).join(', ')}. What other key skills would you like to add?`
          );
        } else {
          questions.push('What are your top professional skills?');
        }
        break;

      case 'availability_status':
        questions.push(
          `As a ${headline}, when would you be available for new opportunities? Are you immediately available, available in 3 months, 6 months, not currently available, or would it be by arrangement?`
        );
        break;

      case 'remote_work_preference':
        questions.push(
          "What's your preferred work arrangement - fully remote, hybrid, on-site, or flexible?"
        );
        break;

      case 'compensation':
        // Be more intelligent about compensation
        const seniority = estimateSeniority(cvData);
        if (seniority === 'senior') {
          questions.push(
            'For senior roles like yours, what compensation range are you targeting?'
          );
        } else {
          questions.push(
            'What salary range would you be looking for in your next role?'
          );
        }
        break;

      default:
        questions.push(field.question);
    }
  });

  return questions;
}

/**
 * Helper: Calculate years of experience from work history
 */
function calculateYearsOfExperience(workHistory: any[]): number {
  if (!workHistory || workHistory.length === 0) return 0;

  let earliestDate = new Date();
  let latestDate = new Date(0);

  workHistory.forEach((job) => {
    if (job.start_date) {
      const startDate = new Date(job.start_date);
      if (startDate < earliestDate) earliestDate = startDate;
    }

    if (job.is_current) {
      latestDate = new Date();
    } else if (job.end_date) {
      const endDate = new Date(job.end_date);
      if (endDate > latestDate) latestDate = endDate;
    }
  });

  const years = Math.floor(
    (latestDate.getTime() - earliestDate.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );
  return Math.max(0, years);
}

/**
 * Helper: Extract key achievement from job description
 */
function extractKeyAchievement(description: string): string | null {
  if (!description) return null;

  // Look for patterns indicating achievements
  const patterns = [
    /(?:led|managed|increased|improved|reduced|saved|generated|created|built|launched).*?(?:\$[\d.]+[MK]?|[\d]+%|[\d]+ (?:million|thousand))/i,
    /(?:• |^)(.{20,150}(?:increased|improved|reduced|saved|generated|achieved|delivered).*?)(?:\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0].replace(/^[•\s]+/, '').trim();
    }
  }

  // Fallback to first sentence if it's meaningful
  const firstSentence = description.split('.')[0];
  if (
    firstSentence &&
    firstSentence.length > 20 &&
    firstSentence.length < 150
  ) {
    return firstSentence.trim();
  }

  return null;
}

/**
 * Helper: Generate skill suggestions based on role and experience
 */
function generateSkillSuggestions(cvData: any): string[] {
  const suggestions: string[] = [];
  const title = (cvData.currentRole || cvData.title || '').toLowerCase();

  // Role-based suggestions
  if (title.includes('ceo') || title.includes('chief executive')) {
    suggestions.push(
      'Strategic Planning',
      'Leadership',
      'P&L Management',
      'Stakeholder Management'
    );
  } else if (title.includes('cto') || title.includes('chief technology')) {
    suggestions.push(
      'Technology Strategy',
      'Digital Transformation',
      'Team Leadership',
      'Innovation'
    );
  } else if (title.includes('cfo') || title.includes('chief financial')) {
    suggestions.push(
      'Financial Planning',
      'Risk Management',
      'Budgeting',
      'Financial Analysis'
    );
  } else if (title.includes('engineer')) {
    suggestions.push(
      'Software Development',
      'Problem Solving',
      'System Design',
      'Technical Leadership'
    );
  } else if (title.includes('manager')) {
    suggestions.push(
      'Team Management',
      'Project Management',
      'Strategic Planning',
      'Communication'
    );
  } else if (title.includes('director')) {
    suggestions.push(
      'Leadership',
      'Strategic Planning',
      'Business Development',
      'Team Building'
    );
  }

  // Add from existing skills if available
  if (cvData.skills?.length > 0) {
    suggestions.push(...cvData.skills);
  }

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Helper: Estimate seniority level from CV data
 */
function estimateSeniority(cvData: any): 'junior' | 'mid' | 'senior' {
  const title = (cvData.currentRole || cvData.title || '').toLowerCase();
  const yearsExperience = cvData.workHistory
    ? calculateYearsOfExperience(cvData.workHistory)
    : 0;
  const hasBoardExperience = cvData.boardExperience?.length > 0;

  // Check for C-level or senior titles
  if (
    title.includes('chief') ||
    title.includes('ceo') ||
    title.includes('cto') ||
    title.includes('cfo') ||
    title.includes('vp') ||
    title.includes('vice president') ||
    title.includes('director') ||
    hasBoardExperience
  ) {
    return 'senior';
  }

  // Check years of experience
  if (yearsExperience >= 10) return 'senior';
  if (yearsExperience >= 5) return 'mid';

  // Check for senior keywords
  if (
    title.includes('senior') ||
    title.includes('lead') ||
    title.includes('principal')
  ) {
    return 'senior';
  }

  if (
    title.includes('junior') ||
    title.includes('associate') ||
    title.includes('intern')
  ) {
    return 'junior';
  }

  return 'mid';
}

/**
 * Generate complete smart profile recommendations
 */
export function generateSmartProfile(cvData: any): SmartProfileData {
  return {
    professional_headline: generateProfessionalHeadline(cvData),
    bio: generateSmartBio(cvData),
    skills_recommendation: generateSkillSuggestions(cvData),
    sectors_recommendation: generateSectorRecommendations(cvData),
  };
}
