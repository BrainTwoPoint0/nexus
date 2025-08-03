import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProfileData {
  personalInfo: {
    name?: string;
    title?: string;
    location?: string;
    email?: string;
  };
  workExperience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    isCurrentRole?: boolean;
    keyAchievements?: string[];
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    graduationYear?: number;
    honors?: string[];
  }>;
  skills: string[];
  certifications: string[];
  boardExperience?: Array<{
    organization: string;
    role: string;
    sector?: string;
    keyContributions?: string;
  }>;
}

export async function generateProfessionalBio(
  data: ProfileData
): Promise<string> {
  try {
    const prompt = `
You are an expert professional bio writer specializing in executive and board member profiles. Create a compelling, professional bio based on the following information. The bio should be suitable for board positions, executive roles, and professional networking.

Guidelines:
- Write in third person
- 150-200 words maximum
- Focus on leadership, achievements, and strategic impact. The bio should be about a performer - not a doer.
- Highlight board experience and governance expertise if present
- Emphasize quantifiable achievements and results
- Use professional, executive-level language
- Make it engaging and memorable
- End with current focus or expertise areas

Profile Information:

PERSONAL INFO:
${data.personalInfo.name ? `Name: ${data.personalInfo.name}` : ''}
${data.personalInfo.title ? `Current Title: ${data.personalInfo.title}` : ''}
${data.personalInfo.location ? `Location: ${data.personalInfo.location}` : ''}

WORK EXPERIENCE:
${data.workExperience
  .map(
    (exp, index) => `
${index + 1}. ${exp.title} at ${exp.company}
   Duration: ${exp.startDate} - ${exp.endDate || 'Present'}${exp.isCurrentRole ? ' (Current)' : ''}
   Key Achievements: ${exp.keyAchievements?.join('; ') || 'N/A'}
   ${exp.description ? `Description: ${exp.description}` : ''}
`
  )
  .join('\n')}

EDUCATION:
${data.education
  .map(
    (edu, index) => `
${index + 1}. ${edu.degree} from ${edu.institution}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}
   ${edu.honors?.length ? `Honors: ${edu.honors.join(', ')}` : ''}
`
  )
  .join('\n')}

BOARD EXPERIENCE:
${
  data.boardExperience?.length
    ? data.boardExperience
        .map(
          (board, index) => `
${index + 1}. ${board.role} at ${board.organization}
   ${board.sector ? `Sector: ${board.sector}` : ''}
   ${board.keyContributions ? `Contributions: ${board.keyContributions}` : ''}
`
        )
        .join('\n')
    : 'None specified'
}

SKILLS: ${data.skills.join(', ')}

CERTIFICATIONS: ${data.certifications.join(', ')}

Write a professional bio that captures this person's expertise, leadership experience, and value proposition for board and executive roles. Focus on their strategic impact and governance capabilities.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert professional bio writer specializing in executive and board member profiles. Write compelling, results-focused bios that highlight leadership and strategic impact.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const generatedBio = response.choices[0]?.message?.content;
    if (!generatedBio) {
      throw new Error('No bio generated from OpenAI');
    }

    console.log('Professional bio generated successfully');
    return generatedBio.trim();
  } catch (error) {
    console.error('Error generating professional bio:', error);

    // Fallback: Create a simple bio from the data
    const fallbackBio = createFallbackBio(data);
    return fallbackBio;
  }
}

function createFallbackBio(data: ProfileData): string {
  const name = data.personalInfo.name || 'This professional';
  const currentRole = data.workExperience.find((exp) => exp.isCurrentRole);
  const education = data.education[0]; // Most recent/relevant education
  const topSkills = data.skills.slice(0, 5); // Top 5 skills

  let bio = '';

  // Introduction with current role
  if (currentRole) {
    bio += `${name} is ${currentRole.title} at ${currentRole.company}, `;
  } else {
    bio += `${name} is an experienced professional `;
  }

  // Add key experience
  if (data.workExperience.length > 0) {
    const totalYears = calculateTotalExperience(data.workExperience);
    bio += `with ${totalYears}+ years of leadership experience across `;

    const companies = data.workExperience.slice(0, 3).map((exp) => exp.company);
    bio += `${companies.join(', ')}.`;
  }

  // Add education if notable
  if (education) {
    bio += ` ${name.split(' ')[0]} holds a ${education.degree} from ${education.institution}.`;
  }

  // Add key skills/expertise
  if (topSkills.length > 0) {
    bio += ` Expertise includes ${topSkills.join(', ')}.`;
  }

  // Add board experience if any
  if (data.boardExperience && data.boardExperience.length > 0) {
    bio += ` Currently serves on ${data.boardExperience.length} board${data.boardExperience.length > 1 ? 's' : ''}.`;
  }

  return bio;
}

function calculateTotalExperience(
  workExperience: ProfileData['workExperience']
): number {
  const totalMonths = workExperience.reduce((total, exp) => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    return total + Math.max(0, months);
  }, 0);

  return Math.floor(totalMonths / 12);
}

export async function generateBioFromProfile(
  profile: {
    first_name?: string;
    last_name?: string;
    professional_headline?: string;
    location?: string;
    email?: string;
    skills?: string[];
  },
  workHistory: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    key_achievements?: string[];
    description?: string;
  }>,
  boardExperience: Array<{
    organization: string;
    role: string;
    sector?: string;
    key_contributions?: string;
  }>,
  education: Array<{
    institution: string;
    degree: string;
    graduation_year?: number;
    honors?: string[];
  }>,
  certifications: Array<{ name: string }>
): Promise<string> {
  const profileData: ProfileData = {
    personalInfo: {
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      title: profile.professional_headline,
      location: profile.location,
      email: profile.email,
    },
    workExperience: workHistory.map((work) => ({
      company: work.company,
      title: work.title,
      startDate: work.start_date,
      endDate: work.end_date,
      isCurrentRole: work.is_current,
      keyAchievements: work.key_achievements || [],
      description: work.description,
    })),
    education: education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      graduationYear: edu.graduation_year,
      honors: edu.honors || [],
    })),
    skills: profile.skills || [],
    certifications: certifications.map((cert) => cert.name) || [],
    boardExperience: boardExperience.map((board) => ({
      organization: board.organization,
      role: board.role,
      sector: board.sector,
      keyContributions: board.key_contributions,
    })),
  };

  return generateProfessionalBio(profileData);
}
