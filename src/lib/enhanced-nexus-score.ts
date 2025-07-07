import { createClient } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EnhancedNexusScoreFactors {
  skills_score: number;
  experience_relevance_score: number;
  sector_expertise_score: number;
  cultural_fit_score: number;
  compensation_alignment_score: number;
  geographic_preference_score: number;
}

export interface EnhancedNexusScoreResult extends EnhancedNexusScoreFactors {
  overall_score: number;
  explanation: string;
  recommendation_reasons: string[];
  board_experience_weight: number;
  skills_match_detail: SkillsMatchDetail;
}

export interface SkillsMatchDetail {
  matched_skills: string[];
  missing_skills: string[];
  additional_skills: string[];
  match_percentage: number;
}

interface CandidateProfile {
  id: string;
  skills?: string[];
  experience_years?: number;
  sector_preferences?: string[];
  location?: string;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  availability_status?: string;
  travel_willingness?: string;
  // Board experience data
  board_experience?: BoardExperience[];
  // Cultural assessment data
  cultural_assessment?: CulturalAssessment;
}

interface BoardExperience {
  organization_name: string;
  position_type: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  sector: string;
  organization_size?: string;
  responsibilities?: string[];
}

interface CulturalAssessment {
  leadership_style?: string;
  decision_making_approach?: string;
  communication_style?: string;
  values_alignment?: string[];
  working_style_preferences?: string[];
}

interface JobOpportunity {
  id: string;
  title: string;
  required_skills?: string[];
  preferred_skills?: string[];
  experience_required?: number;
  sector?: string;
  location?: string;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  remote_work_available?: boolean;
  travel_requirements?: string;
  // Organization culture requirements
  cultural_requirements?: {
    leadership_style?: string;
    decision_making_approach?: string;
    values_required?: string[];
    working_environment?: string;
  };
}

export async function calculateEnhancedNexusScore(
  candidateId: string,
  jobId: string,
  supabase?: SupabaseClient
): Promise<EnhancedNexusScoreResult> {
  const supabaseClient = supabase || createClient();

  // Fetch comprehensive candidate data - fetch related data separately to avoid join issues
  const { data: candidates, error: candidateError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', candidateId);

  if (candidateError) {
    console.error(
      `Database error for candidate ${candidateId}:`,
      candidateError
    );
    throw new Error(
      `Failed to fetch candidate ${candidateId}: ${candidateError.message}`
    );
  }

  if (!candidates || candidates.length === 0) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  if (candidates.length > 1) {
    console.warn(
      `Multiple profiles found for candidate ${candidateId}, using the first one`
    );
  }

  const candidate = candidates[0];

  // Fetch related board experience
  const { data: boardExperience } = await supabaseClient
    .from('board_experience')
    .select('*')
    .eq('profile_id', candidateId);

  // Fetch related cultural assessment
  const { data: culturalAssessments } = await supabaseClient
    .from('cultural_assessment')
    .select('*')
    .eq('profile_id', candidateId);

  // Combine the data
  const candidateWithRelations = {
    ...candidate,
    board_experience: boardExperience || [],
    cultural_assessment:
      culturalAssessments && culturalAssessments.length > 0
        ? culturalAssessments[0]
        : null,
  };

  // Fetch job data
  const { data: jobs, error: jobError } = await supabaseClient
    .from('jobs')
    .select('*')
    .eq('id', jobId);

  if (jobError) {
    console.error(`Database error for job ${jobId}:`, jobError);
    throw new Error(`Failed to fetch job ${jobId}: ${jobError.message}`);
  }

  if (!jobs || jobs.length === 0) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (jobs.length > 1) {
    console.warn(`Multiple jobs found for ID ${jobId}, using the first one`);
  }

  const job = jobs[0];

  // Calculate board experience weight
  const board_experience_weight = calculateBoardExperienceWeight(
    candidateWithRelations.board_experience || []
  );

  // Calculate individual scores
  const skills_score = calculateEnhancedSkillsMatch(
    candidateWithRelations,
    job
  );
  const experience_relevance_score = calculateExperienceRelevance(
    candidateWithRelations,
    job,
    board_experience_weight
  );
  const sector_expertise_score = calculateSectorExpertise(
    candidateWithRelations,
    job
  );
  const cultural_fit_score = calculateCulturalFit(candidateWithRelations, job);
  const compensation_alignment_score = calculateCompensationAlignment(
    candidateWithRelations,
    job
  );
  const geographic_preference_score = calculateGeographicPreference(
    candidateWithRelations,
    job
  );

  // Calculate weighted overall score with new factors
  const overall_score = Math.round(
    skills_score * 0.35 +
      experience_relevance_score * 0.25 +
      sector_expertise_score * 0.2 +
      cultural_fit_score * 0.1 +
      compensation_alignment_score * 0.05 +
      geographic_preference_score * 0.05
  );

  const skills_match_detail = getSkillsMatchDetail(candidateWithRelations, job);
  const recommendation_reasons = generateRecommendationReasons({
    skills_score,
    experience_relevance_score,
    sector_expertise_score,
    cultural_fit_score,
    compensation_alignment_score,
    geographic_preference_score,
    overall_score,
    skills_match_detail,
    board_experience_weight,
  });

  const explanation = generateEnhancedExplanation({
    skills_score,
    experience_relevance_score,
    sector_expertise_score,
    cultural_fit_score,
    compensation_alignment_score,
    geographic_preference_score,
    overall_score,
    explanation: '',
    recommendation_reasons,
    board_experience_weight,
    skills_match_detail,
  });

  // Store the enhanced score in the database
  await supabaseClient.from('nexus_scores').upsert({
    candidate_id: candidateId,
    job_id: jobId,
    overall_score,
    skills_score,
    experience_score: experience_relevance_score, // Map to existing field for backward compatibility
    sector_score: sector_expertise_score, // Map to existing field
    location_score: geographic_preference_score, // Map to existing field
    cultural_fit_score,
    experience_relevance_score,
    board_experience_weight,
    compensation_alignment_score,
    skills_match_detail,
    recommendation_reasons,
    calculated_at: new Date().toISOString(),
  });

  return {
    overall_score,
    skills_score,
    experience_relevance_score,
    sector_expertise_score,
    cultural_fit_score,
    compensation_alignment_score,
    geographic_preference_score,
    explanation,
    recommendation_reasons,
    board_experience_weight,
    skills_match_detail,
  };
}

function calculateBoardExperienceWeight(
  boardExperience: BoardExperience[]
): number {
  if (!boardExperience || boardExperience.length === 0) return 0;

  let weight = 0;

  // Base weight for having board experience
  weight += 0.3;

  // Additional weight for multiple positions
  weight += Math.min(0.4, boardExperience.length * 0.1);

  // Weight for current positions
  const currentPositions = boardExperience.filter(
    (exp) => exp.is_current
  ).length;
  weight += Math.min(0.2, currentPositions * 0.1);

  // Weight for diverse sectors
  const uniqueSectors = new Set(boardExperience.map((exp) => exp.sector)).size;
  weight += Math.min(0.1, uniqueSectors * 0.05);

  return Math.min(1.0, weight);
}

function calculateEnhancedSkillsMatch(
  candidate: CandidateProfile,
  job: JobOpportunity
): number {
  const candidateSkills = candidate.skills || [];
  const requiredSkills = job.required_skills || [];
  const preferredSkills = job.preferred_skills || [];

  if (requiredSkills.length === 0 && preferredSkills.length === 0) return 50;

  let score = 0;

  // Required skills matching (70% weight)
  if (requiredSkills.length > 0) {
    const requiredMatches = fuzzyMatchSkills(candidateSkills, requiredSkills);
    const requiredScore = (requiredMatches / requiredSkills.length) * 70;
    score += requiredScore;
  }

  // Preferred skills matching (30% weight)
  if (preferredSkills.length > 0) {
    const preferredMatches = fuzzyMatchSkills(candidateSkills, preferredSkills);
    const preferredScore = (preferredMatches / preferredSkills.length) * 30;
    score += preferredScore;
  }

  return Math.min(100, Math.round(score));
}

function fuzzyMatchSkills(
  candidateSkills: string[],
  targetSkills: string[]
): number {
  let matches = 0;
  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());

  for (const targetSkill of targetSkills) {
    const targetLower = targetSkill.toLowerCase();

    // Exact match
    if (candidateSkillsLower.includes(targetLower)) {
      matches += 1;
      continue;
    }

    // Partial match (contains)
    const partialMatch = candidateSkillsLower.some(
      (skill) => skill.includes(targetLower) || targetLower.includes(skill)
    );

    if (partialMatch) {
      matches += 0.7; // Partial match gets 70% credit
      continue;
    }

    // Synonym/related terms matching (basic implementation)
    const synonymMatch = findSynonymMatch(targetLower, candidateSkillsLower);
    if (synonymMatch) {
      matches += 0.5; // Synonym match gets 50% credit
    }
  }

  return matches;
}

function findSynonymMatch(
  targetSkill: string,
  candidateSkills: string[]
): boolean {
  // Basic synonym mapping - can be expanded
  const synonyms: { [key: string]: string[] } = {
    leadership: ['management', 'leading', 'supervision'],
    finance: ['financial', 'accounting', 'budgeting'],
    strategy: ['strategic', 'planning', 'development'],
    governance: ['compliance', 'oversight', 'regulation'],
    risk: ['risk management', 'risk assessment', 'risk control'],
    technology: ['tech', 'digital', 'it', 'information technology'],
    marketing: ['branding', 'advertising', 'promotion'],
    operations: ['operational', 'process', 'efficiency'],
  };

  const targetSynonyms = synonyms[targetSkill] || [];
  return candidateSkills.some((skill) =>
    targetSynonyms.some((synonym) => skill.includes(synonym))
  );
}

function calculateExperienceRelevance(
  candidate: CandidateProfile,
  job: JobOpportunity,
  boardWeight: number
): number {
  const candidateExp = candidate.experience_years || 0;
  const requiredExp = job.experience_required || 0;

  let baseScore = 0;

  if (requiredExp === 0) {
    baseScore = 80; // No specific requirement
  } else if (candidateExp >= requiredExp) {
    // Bonus for more experience, but with diminishing returns
    const bonus = Math.min(20, (candidateExp - requiredExp) * 2);
    baseScore = Math.min(100, 80 + bonus);
  } else {
    // Penalty for less experience
    const ratio = candidateExp / requiredExp;
    baseScore = Math.max(0, Math.round(ratio * 70));
  }

  // Apply board experience weight (can boost score significantly)
  const boardBonus = boardWeight * 30; // Up to 30 point bonus
  const finalScore = Math.min(100, baseScore + boardBonus);

  return Math.round(finalScore);
}

function calculateSectorExpertise(
  candidate: CandidateProfile,
  job: JobOpportunity
): number {
  const candidatePreferences = candidate.sector_preferences || [];
  const jobSector = job.sector;

  if (!jobSector || candidatePreferences.length === 0) return 50;

  const candidatePrefsLower = candidatePreferences.map((s) => s.toLowerCase());
  const jobSectorLower = jobSector.toLowerCase();

  // Exact match
  if (candidatePrefsLower.includes(jobSectorLower)) {
    return 100;
  }

  // Partial match
  const partialMatch = candidatePrefsLower.some(
    (pref) => pref.includes(jobSectorLower) || jobSectorLower.includes(pref)
  );

  if (partialMatch) {
    return 80;
  }

  // Related sector matching (basic implementation)
  const relatedMatch = findRelatedSector(jobSectorLower, candidatePrefsLower);
  if (relatedMatch) {
    return 60;
  }

  return 30; // No match
}

function findRelatedSector(
  jobSector: string,
  candidatePreferences: string[]
): boolean {
  const relatedSectors: { [key: string]: string[] } = {
    technology: ['fintech', 'software', 'digital', 'tech'],
    financial: ['banking', 'finance', 'fintech', 'insurance'],
    healthcare: ['pharma', 'biotech', 'medical', 'health'],
    energy: ['renewable', 'oil', 'gas', 'utilities'],
    retail: ['consumer', 'e-commerce', 'fashion', 'food'],
    manufacturing: ['industrial', 'automotive', 'engineering'],
  };

  const jobRelated = relatedSectors[jobSector] || [];
  return candidatePreferences.some((pref) =>
    jobRelated.some((related) => pref.includes(related))
  );
}

function calculateCulturalFit(
  candidate: CandidateProfile,
  job: JobOpportunity
): number {
  const candidateAssessment = candidate.cultural_assessment;
  const jobRequirements = job.cultural_requirements;

  if (!candidateAssessment || !jobRequirements) return 50;

  let score = 0;
  let factors = 0;

  // Leadership style match
  if (
    candidateAssessment.leadership_style &&
    jobRequirements.leadership_style
  ) {
    factors++;
    if (
      candidateAssessment.leadership_style === jobRequirements.leadership_style
    ) {
      score += 25;
    } else {
      score += 10; // Partial credit for having a defined style
    }
  }

  // Decision making approach match
  if (
    candidateAssessment.decision_making_approach &&
    jobRequirements.decision_making_approach
  ) {
    factors++;
    if (
      candidateAssessment.decision_making_approach ===
      jobRequirements.decision_making_approach
    ) {
      score += 25;
    } else {
      score += 10;
    }
  }

  // Values alignment
  if (candidateAssessment.values_alignment && jobRequirements.values_required) {
    factors++;
    const commonValues = candidateAssessment.values_alignment.filter((value) =>
      jobRequirements.values_required?.includes(value)
    );
    const alignmentScore =
      (commonValues.length / jobRequirements.values_required.length) * 25;
    score += alignmentScore;
  }

  // Working style preferences
  if (
    candidateAssessment.working_style_preferences &&
    jobRequirements.working_environment
  ) {
    factors++;
    const environmentMatch = candidateAssessment.working_style_preferences.some(
      (style) =>
        style
          .toLowerCase()
          .includes(jobRequirements.working_environment?.toLowerCase() || '')
    );
    score += environmentMatch ? 25 : 10;
  }

  // Return average if we have cultural data, otherwise neutral score
  return factors > 0 ? Math.round((score / factors) * 4) : 50;
}

function calculateCompensationAlignment(
  candidate: CandidateProfile,
  job: JobOpportunity
): number {
  const candidateMin = candidate.compensation_min;
  const candidateMax = candidate.compensation_max;
  const jobMin = job.compensation_min;
  const jobMax = job.compensation_max;

  // If no compensation data, return neutral score
  if (!candidateMin || !jobMin || !jobMax) return 50;

  // Check currency compatibility (simplified)
  if (candidate.compensation_currency !== job.compensation_currency) {
    return 40; // Slight penalty for currency mismatch
  }

  // Perfect alignment
  if (candidateMin <= jobMax && (candidateMax || candidateMin) >= jobMin) {
    const overlapStart = Math.max(candidateMin, jobMin);
    const overlapEnd = Math.min(candidateMax || candidateMin, jobMax);
    const overlapSize = overlapEnd - overlapStart;
    const candidateRange = (candidateMax || candidateMin) - candidateMin;
    const jobRange = jobMax - jobMin;

    // Score based on overlap percentage
    const overlapRatio = overlapSize / Math.min(candidateRange || 1, jobRange);
    return Math.round(60 + overlapRatio * 40);
  }

  // Calculate gap
  if (candidateMin > jobMax) {
    // Candidate expects more than job offers
    const gap = (candidateMin - jobMax) / jobMax;
    return Math.max(0, Math.round(50 - gap * 100));
  }

  if ((candidateMax || candidateMin) < jobMin) {
    // Candidate expects less than job minimum
    return 80; // Good for employer
  }

  return 30; // No clear alignment
}

function calculateGeographicPreference(
  candidate: CandidateProfile,
  job: JobOpportunity
): number {
  const candidateLocation = candidate.location?.toLowerCase() || '';
  const jobLocation = job.location?.toLowerCase() || '';

  if (!candidateLocation || !jobLocation) return 50;

  // Remote work available
  if (job.remote_work_available || jobLocation.includes('remote')) {
    return 100;
  }

  // Exact location match
  if (candidateLocation === jobLocation) {
    return 100;
  }

  // City match
  if (
    candidateLocation.includes(jobLocation) ||
    jobLocation.includes(candidateLocation)
  ) {
    return 90;
  }

  // Country match
  const candidateCountry = candidateLocation.split(',').pop()?.trim() || '';
  const jobCountry = jobLocation.split(',').pop()?.trim() || '';

  if (candidateCountry === jobCountry) {
    return 70;
  }

  // Travel willingness consideration
  if (
    candidate.travel_willingness === 'high' ||
    candidate.travel_willingness === 'medium'
  ) {
    return 60;
  }

  return 30; // Different countries, limited travel willingness
}

function getSkillsMatchDetail(
  candidate: CandidateProfile,
  job: JobOpportunity
): SkillsMatchDetail {
  const candidateSkills = candidate.skills || [];
  const requiredSkills = job.required_skills || [];
  const preferredSkills = job.preferred_skills || [];
  const allJobSkills = [...requiredSkills, ...preferredSkills];

  const matched_skills: string[] = [];
  const missing_skills: string[] = [];
  const additional_skills: string[] = [];

  // Find matched skills
  for (const jobSkill of allJobSkills) {
    const isMatch = candidateSkills.some(
      (candidateSkill) =>
        candidateSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(candidateSkill.toLowerCase())
    );

    if (isMatch) {
      matched_skills.push(jobSkill);
    } else {
      missing_skills.push(jobSkill);
    }
  }

  // Find additional skills candidate has
  for (const candidateSkill of candidateSkills) {
    const isRelevant = allJobSkills.some(
      (jobSkill) =>
        candidateSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(candidateSkill.toLowerCase())
    );

    if (!isRelevant) {
      additional_skills.push(candidateSkill);
    }
  }

  const match_percentage =
    allJobSkills.length > 0
      ? Math.round((matched_skills.length / allJobSkills.length) * 100)
      : 0;

  return {
    matched_skills,
    missing_skills,
    additional_skills,
    match_percentage,
  };
}

function generateRecommendationReasons(scores: {
  skills_score: number;
  experience_relevance_score: number;
  sector_expertise_score: number;
  cultural_fit_score: number;
  compensation_alignment_score: number;
  geographic_preference_score: number;
  overall_score: number;
  skills_match_detail: SkillsMatchDetail;
  board_experience_weight: number;
}): string[] {
  const reasons: string[] = [];

  if (scores.skills_score >= 80) {
    reasons.push(
      `Strong skills match (${scores.skills_match_detail.match_percentage}% of required skills)`
    );
  }

  if (
    scores.experience_relevance_score >= 80 &&
    scores.board_experience_weight > 0.5
  ) {
    reasons.push('Extensive board experience relevant to this role');
  }

  if (scores.sector_expertise_score >= 80) {
    reasons.push('Perfect sector expertise alignment');
  }

  if (scores.cultural_fit_score >= 75) {
    reasons.push('Excellent cultural fit based on assessment');
  }

  if (scores.compensation_alignment_score >= 80) {
    reasons.push('Compensation expectations align well');
  }

  if (scores.geographic_preference_score >= 90) {
    reasons.push('Location preferences perfectly matched');
  }

  if (scores.overall_score >= 90) {
    reasons.push('Exceptional overall match across all factors');
  } else if (scores.overall_score >= 75) {
    reasons.push('Strong overall match with minor gaps');
  }

  return reasons;
}

function generateEnhancedExplanation(scores: EnhancedNexusScoreResult): string {
  const factors = [];

  // Skills
  if (scores.skills_score >= 80) {
    factors.push('Excellent skills match');
  } else if (scores.skills_score >= 60) {
    factors.push('Good skills alignment');
  } else {
    factors.push('Some skills gaps identified');
  }

  // Experience
  if (scores.experience_relevance_score >= 80) {
    factors.push('Strong experience fit');
  } else if (scores.experience_relevance_score >= 60) {
    factors.push('Adequate experience level');
  } else {
    factors.push('Experience development needed');
  }

  // Sector
  if (scores.sector_expertise_score >= 80) {
    factors.push('Perfect sector match');
  } else if (scores.sector_expertise_score >= 60) {
    factors.push('Related sector experience');
  } else {
    factors.push('Cross-sector opportunity');
  }

  // Cultural fit
  if (scores.cultural_fit_score >= 75) {
    factors.push('Strong cultural alignment');
  } else if (scores.cultural_fit_score >= 60) {
    factors.push('Good cultural fit');
  } else {
    factors.push('Cultural fit to be assessed');
  }

  // Compensation
  if (scores.compensation_alignment_score >= 80) {
    factors.push('Compensation aligned');
  } else if (scores.compensation_alignment_score >= 60) {
    factors.push('Compensation negotiable');
  } else {
    factors.push('Compensation gap exists');
  }

  // Location
  if (scores.geographic_preference_score >= 90) {
    factors.push('Location perfect match');
  } else if (scores.geographic_preference_score >= 60) {
    factors.push('Location workable');
  } else {
    factors.push('Location may be challenging');
  }

  return factors.join(' • ');
}

export async function getEnhancedNexusScore(
  candidateId: string,
  jobId: string
): Promise<EnhancedNexusScoreResult | null> {
  const supabase = createClient();

  const { data: scores, error } = await supabase
    .from('nexus_scores')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId);

  if (error || !scores || scores.length === 0) {
    return null;
  }

  const data = scores[0]; // Use the first score if multiple exist

  return {
    overall_score: data.overall_score,
    skills_score: data.skills_score,
    experience_relevance_score:
      data.experience_relevance_score || data.experience_score,
    sector_expertise_score: data.sector_score, // Use correct column name
    cultural_fit_score: data.cultural_fit_score || 50,
    compensation_alignment_score: data.compensation_alignment_score || 50,
    geographic_preference_score: data.location_score, // Use correct column name
    explanation: generateEnhancedExplanation(data),
    recommendation_reasons: data.recommendation_reasons || [],
    board_experience_weight: data.board_experience_weight || 0,
    skills_match_detail: data.skills_match_detail || {
      matched_skills: [],
      missing_skills: [],
      additional_skills: [],
      match_percentage: 0,
    },
  };
}
