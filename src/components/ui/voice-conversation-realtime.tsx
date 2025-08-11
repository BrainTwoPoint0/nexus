'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  VOICE_AI_CONTEXTS,
  AVAILABILITY_STATUS_LABELS,
  REMOTE_WORK_LABELS,
} from '@/lib/enums';
import {
  generateSmartProfile,
  generateIntelligentQuestions,
} from '@/lib/profile-intelligence';

interface VoiceConversationRealtimeProps {
  cvData: Record<string, any>;
  onComplete: (transcript: string, extractedData: Record<string, any>) => void;
  onError?: (error: string) => void;
}

interface ConversationEvent {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VoiceConversationRealtime({
  cvData,
  onComplete,
  onError,
}: VoiceConversationRealtimeProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const isAISpeakingRef = useRef(false);
  const audioGenerationCompleteRef = useRef(false);
  const hasInitialResponseRef = useRef(false);

  // Helper function to detect unclear/stuttered user responses
  const checkIfUnclearUserResponse = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();

    // Very short responses (likely just noise or stutters)
    if (lowerText.length < 5) return true;

    // Common stutter patterns
    const stutterPatterns = [
      /^(um|uh|er|ah|hmm)\s*$/,
      /^(um|uh|er)\s+(um|uh|er)/,
      /^(i|i'm|i don't|not)\s*(um|uh|er)/,
      /^(well|so|like)\s*(um|uh|er)/,
    ];

    // Check for unclear response indicators
    const unclearIndicators = [
      "i don't know",
      'not sure',
      'unclear',
      'what was the question',
      'can you repeat',
      'sorry what',
    ];

    const hasStutterPattern = stutterPatterns.some((pattern) =>
      pattern.test(lowerText)
    );
    const hasUnclearIndicator = unclearIndicators.some((phrase) =>
      lowerText.includes(phrase)
    );

    return hasStutterPattern || hasUnclearIndicator;
  };
  const isCreatingResponseRef = useRef(false);
  const responseStartTimeRef = useRef<number>(0);
  const [transcript, setTranscript] = useState('');
  const [conversationEvents, setConversationEvents] = useState<
    ConversationEvent[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const transcriptAccumulatorRef = useRef<string>('');
  const isEndingRef = useRef<boolean>(false);

  // Analyze CV data to determine missing fields
  const analyzeCVData = useCallback(() => {
    const missingFields = [];

    // 1. ESSENTIAL PROFILE INFORMATION (always ask if missing)

    // Basic identity and contact
    if (!cvData.first_name && !cvData.firstName) {
      missingFields.push({
        field: 'name',
        question: 'What is your full name?',
      });
    }

    if (!cvData.location) {
      missingFields.push({
        field: 'location',
        question: 'What city and country are you based in?',
      });
    }

    if (!cvData.phone) {
      missingFields.push({
        field: 'phone',
        question: 'What is your phone number?',
      });
    }

    // NOTE: Professional headline is auto-generated from CV data - don't ask for it
    // Bio will be offered as a recommendation, not asked from scratch

    // 2. CAREER PROGRESSION (fundamental career information)

    // Work experience - check both workExperience and workHistory fields
    const hasWorkExperience =
      (cvData.workExperience && cvData.workExperience.length > 0) ||
      (cvData.workHistory && cvData.workHistory.length > 0);

    if (!hasWorkExperience) {
      missingFields.push({
        field: 'work_experience_overview',
        question:
          'Can you walk me through your work experience? Start with your most recent or current position.',
      });
    } else {
      // If work experience exists, intelligently check if enhancements are needed
      // Only ask for achievements if the position seems important/recent and lacks detail
      const workExperience = cvData.workExperience || cvData.workHistory || [];
      workExperience.forEach((exp: Record<string, any>, index: number) => {
        const hasMinimalInfo = !exp.description || exp.description.length < 50;
        const lacksAchievements =
          !exp.key_achievements || exp.key_achievements.length === 0;
        const isRecentOrCurrent =
          exp.is_current ||
          (exp.end_date && new Date(exp.end_date) > new Date('2020-01-01'));
        const isSeniorRole =
          exp.position &&
          (exp.position.toLowerCase().includes('senior') ||
            exp.position.toLowerCase().includes('lead') ||
            exp.position.toLowerCase().includes('director') ||
            exp.position.toLowerCase().includes('manager'));

        // Only ask for achievements if it's a recent/current senior role that lacks detail
        if (
          lacksAchievements &&
          hasMinimalInfo &&
          (isRecentOrCurrent || isSeniorRole)
        ) {
          missingFields.push({
            field: `work_${index}_achievements`,
            question: `What were your key achievements at ${exp.company}?`,
          });
        }
      });
    }

    // Education - if completely missing, ask for it
    if (!cvData.education || cvData.education.length === 0) {
      missingFields.push({
        field: 'education_overview',
        question:
          'What is your educational background? Please include your highest degree and any relevant qualifications.',
      });
    }

    // Board experience - ask if they have any (important for executive roles)
    if (!cvData.boardExperience || cvData.boardExperience.length === 0) {
      missingFields.push({
        field: 'board_experience_check',
        question:
          'Do you have any board experience or non-executive director roles?',
      });
    } else {
      // If board experience exists, intelligently check if enhancements are needed
      // Only ask for contributions if the role lacks meaningful detail
      cvData.boardExperience.forEach(
        (exp: Record<string, any>, index: number) => {
          const hasMinimalInfo =
            !exp.description || exp.description.length < 30;
          const lacksContributions =
            !exp.key_contributions || exp.key_contributions.length === 0;

          // Only ask for contributions if it's a detailed role that lacks specifics
          if (lacksContributions && hasMinimalInfo && exp.organization) {
            missingFields.push({
              field: `board_${index}_contributions`,
              question: `What were your key contributions as ${exp.role} at ${exp.organization}?`,
            });
          }
        }
      );
    }

    // 3. PROFESSIONAL ATTRIBUTES (essential for matching)

    if (!cvData.skills || cvData.skills.length === 0) {
      missingFields.push({
        field: 'skills',
        question:
          'What are your key professional skills and areas of expertise?',
      });
    }

    if (!cvData.sectors || cvData.sectors.length === 0) {
      missingFields.push({
        field: 'sectors',
        question: 'Which industry sectors have you worked in?',
      });
    }

    if (!cvData.languages || cvData.languages.length === 0) {
      missingFields.push({
        field: 'languages',
        question: 'What languages do you speak?',
      });
    }

    // 4. CAREER PREFERENCES (essential for job matching)

    if (!cvData.availability_status) {
      const availabilityOptions = Object.values(AVAILABILITY_STATUS_LABELS)
        .join(', ')
        .replace(/,([^,]*)$/, ', or$1');
      missingFields.push({
        field: 'availability_status',
        question: `When would you be available to start a new role? Choose from: ${availabilityOptions.toLowerCase()}.`,
      });
    }

    if (!cvData.remote_work_preference) {
      const remoteWorkOptions = Object.values(REMOTE_WORK_LABELS)
        .join(', ')
        .replace(/,([^,]*)$/, ', or$1');
      missingFields.push({
        field: 'remote_work_preference',
        question: `What are your remote work preferences? Choose from: ${remoteWorkOptions.toLowerCase()}.`,
      });
    }

    if (!cvData.compensation_expectation_min) {
      missingFields.push({
        field: 'compensation',
        question: 'What is your expected compensation range?',
      });
    }

    // 5. OPTIONAL PROFESSIONAL LINKS (nice to have)

    // Check LinkedIn URL with all possible field variations
    const hasLinkedIn =
      cvData.linkedin_url ||
      cvData.linkedinUrl ||
      cvData.linkedInUrl ||
      cvData.linkedin;
    if (!hasLinkedIn) {
      missingFields.push({
        field: 'linkedin_url',
        question: 'What is your LinkedIn profile URL?',
      });
    }

    if (!cvData.website) {
      missingFields.push({
        field: 'website',
        question: 'Do you have a personal or professional website?',
      });
    }

    // Enhanced logging to debug missing fields detection
    logger.info(
      '🔍 MISSING FIELDS ANALYSIS - CRITICAL DEBUG INFO',
      {
        missingCount: missingFields.length,
        missingFieldsList: missingFields.map((f) => f.field).join(', '),
        fields: missingFields,
        cvDataKeys: Object.keys(cvData || {}),
        criticalChecks: {
          website: {
            exists: !!cvData.website,
            value: cvData.website,
            willAsk: !cvData.website,
          },
          compensation: {
            min: cvData.compensation_expectation_min,
            max: cvData.compensation_expectation_max,
            hasMin: !!cvData.compensation_expectation_min,
            willAsk: !cvData.compensation_expectation_min,
          },
          linkedIn: {
            linkedin_url: cvData.linkedin_url,
            linkedinUrl: cvData.linkedinUrl,
            linkedInUrl: cvData.linkedInUrl,
            linkedin: cvData.linkedin,
            hasLinkedIn: hasLinkedIn,
            willAsk: !hasLinkedIn,
          },
          skills: {
            exists: !!cvData.skills,
            length: cvData.skills?.length || 0,
            value: cvData.skills,
            willAsk: !cvData.skills || cvData.skills.length === 0,
          },
          availabilityStatus: {
            exists: !!cvData.availability_status,
            value: cvData.availability_status,
            willAsk: !cvData.availability_status,
          },
          remoteWork: {
            exists: !!cvData.remote_work_preference,
            value: cvData.remote_work_preference,
            willAsk: !cvData.remote_work_preference,
          },
        },
      },
      'VOICE'
    );
    return missingFields;
  }, [cvData]);

  // Initialize AI context with CV data
  const initializeAIContext = useCallback(() => {
    const missingFields = analyzeCVData();
    const userName = `${cvData.first_name || cvData.firstName || ''}`.trim();

    // Generate smart profile data
    const smartProfile = generateSmartProfile(cvData);
    const intelligentQuestions = generateIntelligentQuestions(
      cvData,
      missingFields
    );

    // Check LinkedIn URL with all possible field variations
    const hasLinkedIn =
      cvData.linkedin_url ||
      cvData.linkedinUrl ||
      cvData.linkedInUrl ||
      cvData.linkedin;
    const linkedInUrl =
      cvData.linkedInUrl ||
      cvData.linkedin_url ||
      cvData.linkedinUrl ||
      cvData.linkedin;

    const context = `You are Nexus AI, an AI recruitment platform that deeply understands professionals from their CV data.
    You have just analyzed ${userName}'s CV and have already generated intelligent insights about their profile.
    
    IMPORTANT: You must demonstrate that you understand them by:
    1. Starting with a warm, personalized greeting that shows you've studied their background
    2. Mentioning specific achievements or roles from their CV
    3. Making intelligent recommendations instead of asking for information we can derive
    
    Start with something like:
    "Hello ${userName}, and welcome to Nexus. I've reviewed your impressive background as ${smartProfile.professional_headline}.
    ${cvData.workHistory?.length > 0 ? `I can see you've had a remarkable career journey with ${cvData.workHistory.length} key positions` : ''}
    ${cvData.boardExperience?.length > 0 ? `, including ${cvData.boardExperience.length} board positions` : ''}.
    I've already prepared some recommendations for your profile based on your experience. Let me quickly confirm a few details to ensure we match you with the perfect opportunities."
    
    Profile we've intelligently generated:
    - Professional Headline: ${smartProfile.professional_headline}
    - Bio Summary: ${smartProfile.bio.substring(0, 150)}...
    ${smartProfile.skills_recommendation && smartProfile.skills_recommendation.length > 0 ? `- Recommended Skills: ${smartProfile.skills_recommendation.slice(0, 3).join(', ')}` : ''}
    ${smartProfile.sectors_recommendation && smartProfile.sectors_recommendation.length > 0 ? `- Industry Sectors: ${smartProfile.sectors_recommendation.join(', ')}` : ''}
    
    Here's what we know from the CV:
    - Name: ${userName}
    - Current Role: ${smartProfile.professional_headline}
    - Location: ${cvData.location || 'Not specified'}
    - Email: ${cvData.email || 'Not specified'}
    - LinkedIn: ${hasLinkedIn ? linkedInUrl : 'Not specified'}
    ${cvData.workExperience?.length > 0 || cvData.workHistory?.length > 0 ? `- Work Experience: ${(cvData.workExperience || cvData.workHistory || []).length} positions` : ''}
    ${cvData.boardExperience?.length > 0 ? `- Board Experience: ${cvData.boardExperience.length} positions` : ''}
    ${cvData.education?.length > 0 ? `- Education: ${cvData.education.length} qualifications` : ''}
    
    🚨 CRITICAL: MISSING FIELDS YOU MUST ASK ABOUT (${missingFields.length} total):
    ${missingFields.map((field, index) => `${index + 1}. REQUIRED: ${field.field} - "${field.question}"`).join('\n    ')}
    
    ⚠️ IMPORTANT: You have ${missingFields.length} questions to ask. DO NOT end the conversation until you have asked about ALL ${missingFields.length} fields above.
    
    Smart questions to ask (show understanding, don't ask for derivable info):
    ${intelligentQuestions.join('\n')}
    
    ${
      cvData.professionalBio
        ? `We already have your professional summary from your CV: "${cvData.professionalBio.substring(0, 100)}..." - this looks comprehensive!`
        : `For the professional summary, present our generated bio and ask if they'd like to use it or modify it:
      "I've drafted a professional summary for you: '${smartProfile.bio}' - Would you like to use this, or would you prefer to describe yourself differently?"`
    }
    
    ${VOICE_AI_CONTEXTS.availability_status}
    
    ${VOICE_AI_CONTEXTS.remote_work_preference}
    
    IMPORTANT INSTRUCTIONS:
    1. Be conversational and professional - this is a friendly chat, not a formal interview. Don't be too slow, but don't be too fast either. We want to get it over with but make sure we have all of the information we'll need.
    2. Ask questions naturally, one at a time - wait for their response before moving to the next question
    3. Acknowledge and validate their responses warmly - you want to be informative, not annoying and repetitive
    4. Let them know you'll help transform their casual responses into professional profile content
    5. If they seem hesitant about compensation, explain it helps match them with appropriate opportunities
    6. CRITICAL: You must ask ALL the missing questions listed above before ending the conversation
    7. For availability and remote work questions, use the EXACT wording provided in the context above
    8. When they respond about availability or remote work, confirm their choice using the specific terms (e.g., "Great, so you're immediately available" or "Perfect, so you prefer hybrid work")
    9. ONLY after you have received answers to ALL missing fields, then end with: "Thank you for your time. I have all the information I need to complete your profile. This call will end in a few seconds. Welcome to Nexus!"
    10. If someone declines to answer a question, acknowledge it but continue with the remaining questions
    11. For casual responses, acknowledge them naturally (e.g., if they say "I do Python stuff", you might say "Great! Python development skills, got it.")
    12. If they ask about the company, say something like "Nexus is a platform that helps people find the best opportunities for them. We're a team of 100+ people and we're growing fast. We're based in London, UK and we're looking for people who are passionate about their work and who are looking for a new challenge."
    13. If they start talking about weird stuff, remind them who Nexus is and what you do and ask them to focus on the questions.
    14. CRITICAL: sometimes the user might not know exactly how to answer a question. They'll ask for recommendations, examples, or clarifications - you must ask them to confirm whether to use your recommendations before moving on and storing them.
    15. IMPORTANT: If the user stutters, gives unclear responses, or says something like "um", "uh", "I don't know", or incomplete sentences, DON'T get stuck! Instead, gently ask them to try again or offer specific examples. For example: "I didn't catch that clearly - could you repeat that?" or "No problem, let me give you some options to choose from..." Never leave them hanging without a response.

    Remember this is a casual conversation - be friendly and natural. Let them know you'll help polish their responses for their profile.
    NEVER use the ending phrase until you have asked about ALL missing fields.
    Remember: NEVER ask about information that's already in the CV. Only ask about the missing fields listed above.`;

    return context;
  }, [cvData, analyzeCVData]);

  // Force end conversation
  const forceEndConversation = useCallback(async () => {
    logger.info('Force ending conversation', {}, 'VOICE');
    isEndingRef.current = true;

    // Immediately close all connections
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
    }

    setIsConnected(false);
    setIsConnecting(false);

    // Extract data from transcript using AI
    const finalTranscript = transcriptAccumulatorRef.current;
    if (finalTranscript) {
      logger.info(
        'Extracting data from conversation transcript',
        {
          length: finalTranscript.length,
          transcriptPreview: finalTranscript.substring(0, 500) + '...',
          fullTranscript: finalTranscript,
        },
        'VOICE'
      );

      try {
        const response = await fetch('/api/voice/extract-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: finalTranscript,
            cvData,
          }),
        });

        if (response.ok) {
          const { extractedData } = await response.json();
          logger.info(
            'Data extraction successful',
            {
              fieldsExtracted: Object.keys(extractedData || {}).length,
              extractedData: extractedData,
            },
            'VOICE'
          );
          onComplete(finalTranscript, extractedData);
        } else {
          logger.error(
            'Data extraction failed',
            { status: response.status },
            'VOICE'
          );
          onComplete(finalTranscript, {});
        }
      } catch (error) {
        logger.error('Error during data extraction', error, 'VOICE');
        onComplete(finalTranscript, {});
      }
    } else {
      logger.warn('No transcript to extract data from', {}, 'VOICE');
      onComplete('', {});
    }
  }, [onComplete, cvData]);

  // Start voice conversation
  const startConversation = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      logger.info('Starting voice conversation', {}, 'VOICE');

      // Get ephemeral token
      const tokenResponse = await fetch('/api/voice/realtime-token', {
        method: 'POST',
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get authentication token');
      }

      const { client_secret } = await tokenResponse.json();
      const EPHEMERAL_KEY = client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      // Add event listeners for audio playback state
      audioEl.addEventListener('ended', () => {
        logger.debug('Audio playback ended', {}, 'VOICE');
        setIsAISpeaking(false);
        isAISpeakingRef.current = false;
      });

      audioEl.addEventListener('pause', () => {
        logger.debug('Audio playback paused', {}, 'VOICE');
        setIsAISpeaking(false);
        isAISpeakingRef.current = false;
      });

      pc.ontrack = (e) => {
        logger.debug('Received remote audio track', {}, 'VOICE');
        audioEl.srcObject = e.streams[0];
      };

      // Get user microphone
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        logger.info('Data channel opened', {}, 'VOICE');
        setIsConnected(true);
        setIsConnecting(false);

        // Initialize session with CV context
        const sessionConfig = {
          type: 'session.update',
          session: {
            instructions: initializeAIContext(),
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
              create_response: false,
            },
          },
        };

        dc.send(JSON.stringify(sessionConfig));
        logger.debug('Session configured with CV context', {}, 'VOICE');

        // Wait a moment for session to be fully configured, then trigger ONE initial response
        setTimeout(() => {
          if (
            !isEndingRef.current &&
            !hasInitialResponseRef.current &&
            !isCreatingResponseRef.current
          ) {
            hasInitialResponseRef.current = true;
            isCreatingResponseRef.current = true;
            responseStartTimeRef.current = Date.now();
            setShowRetryButton(false);

            // Show retry button after 6 seconds if initial response is still processing
            setTimeout(() => {
              if (isCreatingResponseRef.current) {
                setShowRetryButton(true);
              }
            }, 6000);

            const createResponse = {
              type: 'response.create',
              response: {
                modalities: ['text', 'audio'],
              },
            };
            dc.send(JSON.stringify(createResponse));
            logger.debug('Triggered single initial AI response', {}, 'VOICE');
          }
        }, 1000);
      });

      dc.addEventListener('message', (e) => {
        if (isEndingRef.current) return;

        const event = JSON.parse(e.data);

        // Handle different event types
        switch (event.type) {
          case 'input_audio_buffer.speech_stopped':
            // User finished speaking, create a response (but only if not already creating one)
            if (!isEndingRef.current && !isCreatingResponseRef.current) {
              logger.debug(
                'User finished speaking, creating response',
                {},
                'VOICE'
              );
              isCreatingResponseRef.current = true;
              responseStartTimeRef.current = Date.now();
              setShowRetryButton(false);

              // Show retry button after 6 seconds if response is still processing
              setTimeout(() => {
                if (isCreatingResponseRef.current) {
                  setShowRetryButton(true);
                }
              }, 6000);

              const createResponse = {
                type: 'response.create',
                response: {
                  modalities: ['text', 'audio'],
                },
              };
              dc.send(JSON.stringify(createResponse));
            } else if (isCreatingResponseRef.current) {
              logger.debug(
                'User finished speaking, but response already being created',
                {},
                'VOICE'
              );

              // Check how long the current response has been processing
              const currentTime = Date.now();
              const responseProcessingTime =
                currentTime - responseStartTimeRef.current;

              // If response has been processing for more than 5 seconds, allow interruption
              // This handles cases where the AI is stuck or user wants to clarify
              if (responseProcessingTime > 5000) {
                logger.info(
                  'Response processing too long, allowing user interruption',
                  { processingTimeMs: responseProcessingTime },
                  'VOICE'
                );
                isCreatingResponseRef.current = false;
                responseStartTimeRef.current = Date.now();

                // Create new response for the latest user input
                const createResponse = {
                  type: 'response.create',
                  response: {
                    modalities: ['text', 'audio'],
                  },
                };
                dc.send(JSON.stringify(createResponse));
              }
            }
            break;

          case 'conversation.item.created':
            if (
              event.item.role === 'user' &&
              event.item.content?.[0]?.transcript
            ) {
              const userText = event.item.content[0].transcript;
              logger.debug('User speech captured', { userText }, 'VOICE');

              // Check if this looks like an unclear/stuttered response
              const isUnclear = checkIfUnclearUserResponse(userText);
              if (isUnclear) {
                logger.info(
                  'Detected unclear user response, prompting for clarification',
                  { userText, textLength: userText.length },
                  'VOICE'
                );
              }

              setConversationEvents((prev) => [
                ...prev,
                {
                  type: 'user',
                  content: userText,
                  timestamp: new Date(),
                },
              ]);
              transcriptAccumulatorRef.current += `User: ${userText}\n`;
            }
            break;

          case 'response.audio_transcript.delta':
            setTranscript((prev) => prev + event.delta);
            break;

          case 'response.audio_transcript.done':
            const assistantText = event.transcript;
            setConversationEvents((prev) => [
              ...prev,
              {
                type: 'assistant',
                content: assistantText,
                timestamp: new Date(),
              },
            ]);
            transcriptAccumulatorRef.current += `Assistant: ${assistantText}\n`;
            setTranscript('');

            // Check if conversation should end - be more specific about end phrases
            const lowerText = assistantText.toLowerCase();
            const isEndingConversation =
              (lowerText.includes('have a great day') &&
                lowerText.includes('thank you for your time')) ||
              (lowerText.includes('i have all the information i need') &&
                lowerText.includes('thank you')) ||
              lowerText.includes('that completes our interview') ||
              lowerText.includes(
                'i have everything i need to complete your profile'
              );

            if (isEndingConversation) {
              logger.info(
                'AI indicated conversation end',
                { phrase: assistantText },
                'VOICE'
              );

              // Calculate estimated playback time based on message length
              const calculatePlaybackTime = (text: string) => {
                // Average speaking rate: ~150 words per minute (2.5 words per second)
                // Average word length: ~5 characters
                // So roughly 12.5 characters per second
                const charactersPerSecond = 12;
                const estimatedSeconds = Math.ceil(
                  text.length / charactersPerSecond
                );
                // Add 2 second buffer for safety (no maximum cap - let it grow dynamically)
                const playbackTime = Math.max(estimatedSeconds + 2, 3); // Minimum 3 seconds, no maximum
                logger.debug(
                  'Calculated playback time',
                  {
                    textLength: text.length,
                    estimatedSeconds,
                    finalPlaybackTime: playbackTime,
                  },
                  'VOICE'
                );
                return playbackTime * 1000; // Convert to milliseconds
              };

              // Wait for AI to finish generating audio, then wait for calculated playback time
              const endAfterPlayback = () => {
                if (audioGenerationCompleteRef.current) {
                  const playbackDelay = calculatePlaybackTime(assistantText);
                  logger.info(
                    'AI finished generating audio, ending conversation after calculated playback delay',
                    {
                      audioGenerationComplete:
                        audioGenerationCompleteRef.current,
                      playbackDelayMs: playbackDelay,
                      messageLength: assistantText.length,
                    },
                    'VOICE'
                  );
                  setTimeout(() => {
                    forceEndConversation();
                  }, playbackDelay);
                } else {
                  logger.debug(
                    'AI still generating audio, waiting...',
                    {
                      audioGenerationComplete:
                        audioGenerationCompleteRef.current,
                    },
                    'VOICE'
                  );
                  // Check again in 500ms
                  setTimeout(endAfterPlayback, 500);
                }
              };

              // Give a small delay then start checking
              setTimeout(endAfterPlayback, 1000);
            }
            break;

          case 'response.audio.started':
            logger.debug('AI started generating audio', {}, 'VOICE');
            setIsAISpeaking(true);
            isAISpeakingRef.current = true;
            audioGenerationCompleteRef.current = false;
            break;

          case 'response.audio.done':
            logger.debug('AI finished generating audio', {}, 'VOICE');
            audioGenerationCompleteRef.current = true;
            isCreatingResponseRef.current = false; // Reset the flag when response is complete
            setShowRetryButton(false); // Hide retry button when response completes
            // Don't set isAISpeaking to false yet - wait for playback to complete
            break;

          case 'error':
            logger.error('Realtime API error', event, 'VOICE');
            setError(event.error?.message || 'An error occurred');
            // Reset response creation flag in case of error
            isCreatingResponseRef.current = false;
            break;
        }
      });

      dc.addEventListener('error', (error) => {
        logger.error('Data channel error', error, 'VOICE');
        setError('Connection error occurred');
      });

      // Create offer and connect
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to Realtime API');
      }

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);

      logger.info('Connected to Realtime API', {}, 'VOICE');
    } catch (err) {
      logger.error('Failed to start conversation', err, 'VOICE');
      setError(
        err instanceof Error ? err.message : 'Failed to start conversation'
      );
      setIsConnecting(false);
      if (onError) {
        onError(
          err instanceof Error ? err.message : 'Failed to start conversation'
        );
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Force retry if user gets stuck
  const forceRetry = () => {
    if (isCreatingResponseRef.current) {
      logger.info('User manually forcing retry of stuck response', {}, 'VOICE');
      isCreatingResponseRef.current = false;
      responseStartTimeRef.current = 0;
      setShowRetryButton(false);

      // Add a system message to help the AI understand what happened
      if (dcRef.current) {
        const systemMessage = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'The user had trouble with their previous response and wants to try again. Please ask the current question again clearly and offer specific examples if needed.',
              },
            ],
          },
        };
        dcRef.current.send(JSON.stringify(systemMessage));

        // Trigger new response
        setTimeout(() => {
          if (dcRef.current && !isCreatingResponseRef.current) {
            isCreatingResponseRef.current = true;
            responseStartTimeRef.current = Date.now();
            const createResponse = {
              type: 'response.create',
              response: {
                modalities: ['text', 'audio'],
              },
            };
            dcRef.current.send(JSON.stringify(createResponse));
          }
        }, 100);
      }
    }
  };

  // End conversation
  const endConversation = () => {
    logger.info('User ended conversation', {}, 'VOICE');
    forceEndConversation();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center">Voice Interview</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Let&apos;s complete your profile with a quick conversation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="text-center">
          {!isConnected && !isConnecting && (
            <Button
              onClick={startConversation}
              size="lg"
              className="w-full max-w-xs"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Voice Interview
            </Button>
          )}

          {isConnecting && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Connecting to AI assistant...
              </p>
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              {/* Recording Indicator */}
              <div className="flex items-center justify-center space-x-4">
                <motion.div
                  animate={{ scale: isAISpeaking ? [1, 1.2, 1] : 1 }}
                  transition={{
                    repeat: isAISpeaking ? Infinity : 0,
                    duration: 1,
                  }}
                  className="relative"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    {isAISpeaking ? (
                      <Volume2 className="h-8 w-8 text-primary" />
                    ) : (
                      <Mic className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  {!isMuted && !isAISpeaking && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </motion.div>
              </div>

              <p className="text-sm text-muted-foreground">
                {isAISpeaking
                  ? 'AI is speaking...'
                  : 'Listening... Speak naturally'}
              </p>

              {/* Control Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  variant={isMuted ? 'destructive' : 'secondary'}
                  size="sm"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>

                {showRetryButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceRetry}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={endConversation}
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Conversation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversationEvents.length > 0 && (
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border bg-muted/10 p-4">
            <AnimatePresence>
              {conversationEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-3 ${
                    event.type === 'user'
                      ? 'ml-8 bg-primary/10'
                      : 'mr-8 bg-secondary/10'
                  }`}
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {event.type === 'user' ? 'You' : 'AI Assistant'}
                  </p>
                  <p className="text-sm">{event.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mr-8 rounded-lg bg-secondary/10 p-3"
              >
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  AI Assistant
                </p>
                <p className="text-sm italic">{transcript}...</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isConnected && !isConnecting && (
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>Click &quot;Start Voice Interview&quot; to begin</p>
            <p>The AI will ask you a few questions to complete your profile</p>
            <p>Speak naturally and clearly when prompted</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
