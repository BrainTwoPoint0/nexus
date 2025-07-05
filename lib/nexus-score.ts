import { createClient } from '@/lib/supabaseClient';

export interface NexusScoreFactors {
  skills_score: number;
  experience_score: number;
  sector_score: number;
  location_score: number;
}

export interface NexusScoreResult extends NexusScoreFactors {
  overall_score: number;
  explanation: string;
}

export async function calculateNexusScore(
  candidateId: string,
  jobId: string
): Promise<NexusScoreResult> {
  const supabase = createClient();
  
  // Get candidate profile
  const { data: candidate, error: candidateError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single();
    
  if (candidateError) {
    throw new Error(`Failed to fetch candidate: ${candidateError.message}`);
  }
  
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  if (jobError) {
    throw new Error(`Failed to fetch job: ${jobError.message}`);
  }
  
  // Calculate individual scores
  const skills_score = calculateSkillsMatch(candidate, job);
  const experience_score = calculateExperienceMatch(candidate, job);
  const sector_score = calculateSectorMatch(candidate, job);
  const location_score = calculateLocationMatch(candidate, job);
  
  // Calculate weighted overall score
  const overall_score = Math.round(
    (skills_score * 0.4) + 
    (experience_score * 0.3) + 
    (sector_score * 0.2) + 
    (location_score * 0.1)
  );
  
  const explanation = generateScoreExplanation({
    skills_score,
    experience_score,
    sector_score,
    location_score,
    overall_score
  });
  
  // Store the score in the database
  await supabase
    .from('nexus_scores')
    .upsert({
      candidate_id: candidateId,
      job_id: jobId,
      overall_score,
      skills_score,
      experience_score,
      sector_score,
      location_score,
      calculated_at: new Date().toISOString()
    });
  
  return {
    overall_score,
    skills_score,
    experience_score,
    sector_score,
    location_score,
    explanation
  };
}

function calculateSkillsMatch(candidate: any, job: any): number {
  if (!candidate.skills || !job.required_skills) return 0;
  
  const candidateSkills = candidate.skills.map((s: string) => s.toLowerCase());
  const requiredSkills = job.required_skills.map((s: string) => s.toLowerCase());
  
  if (requiredSkills.length === 0) return 50; // Neutral score if no requirements
  
  const matchedSkills = requiredSkills.filter((skill: string) => 
    candidateSkills.some((cSkill: string) => 
      cSkill.includes(skill) || skill.includes(cSkill)
    )
  );
  
  const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;
  return Math.min(100, Math.round(matchPercentage));
}

function calculateExperienceMatch(candidate: any, job: any): number {
  if (!candidate.experience_years || !job.experience_required) return 50;
  
  const candidateExp = candidate.experience_years;
  const requiredExp = job.experience_required;
  
  if (candidateExp >= requiredExp) {
    // Bonus for more experience, but diminishing returns
    const bonus = Math.min(20, (candidateExp - requiredExp) * 2);
    return Math.min(100, 80 + bonus);
  } else {
    // Penalty for less experience
    const ratio = candidateExp / requiredExp;
    return Math.max(0, Math.round(ratio * 80));
  }
}

function calculateSectorMatch(candidate: any, job: any): number {
  if (!candidate.sector_preferences || !job.sector) return 50;
  
  const candidatePreferences = candidate.sector_preferences.map((s: string) => s.toLowerCase());
  const jobSector = job.sector.toLowerCase();
  
  const isMatch = candidatePreferences.some((pref: string) => 
    pref.includes(jobSector) || jobSector.includes(pref)
  );
  
  return isMatch ? 100 : 30; // Strong match or low score
}

function calculateLocationMatch(candidate: any, job: any): number {
  if (!candidate.location || !job.location) return 50;
  
  const candidateLocation = candidate.location.toLowerCase();
  const jobLocation = job.location.toLowerCase();
  
  // Check for remote work
  if (jobLocation.includes('remote') || jobLocation.includes('anywhere')) {
    return 100;
  }
  
  // Check for city/country match
  if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
    return 100;
  }
  
  // Check for same country (basic implementation)
  const candidateCountry = candidateLocation.split(',').pop()?.trim();
  const jobCountry = jobLocation.split(',').pop()?.trim();
  
  if (candidateCountry === jobCountry) {
    return 70;
  }
  
  return 30; // Different countries
}

function generateScoreExplanation(scores: NexusScoreResult): string {
  const factors = [];
  
  if (scores.skills_score >= 80) {
    factors.push("Excellent skills match");
  } else if (scores.skills_score >= 60) {
    factors.push("Good skills alignment");
  } else if (scores.skills_score >= 40) {
    factors.push("Some relevant skills");
  } else {
    factors.push("Limited skills match");
  }
  
  if (scores.experience_score >= 80) {
    factors.push("Strong experience fit");
  } else if (scores.experience_score >= 60) {
    factors.push("Adequate experience");
  } else {
    factors.push("Experience gap identified");
  }
  
  if (scores.sector_score >= 80) {
    factors.push("Perfect sector match");
  } else if (scores.sector_score >= 60) {
    factors.push("Related sector experience");
  } else {
    factors.push("Different sector background");
  }
  
  if (scores.location_score >= 80) {
    factors.push("Location compatible");
  } else if (scores.location_score >= 60) {
    factors.push("Regional match");
  } else {
    factors.push("Location may be a factor");
  }
  
  return factors.join(" • ");
}

export async function getNexusScoreForCandidate(
  candidateId: string,
  jobId: string
): Promise<NexusScoreResult | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('nexus_scores')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return {
    overall_score: data.overall_score,
    skills_score: data.skills_score,
    experience_score: data.experience_score,
    sector_score: data.sector_score,
    location_score: data.location_score,
    explanation: generateScoreExplanation(data)
  };
}