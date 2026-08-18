import type { ParsedPosterData } from './posterParser';

export interface GeneratedReport {
  title: string;
  department: string;
  date: string;
  time: string;
  venue: string;
  objective: string;
  objectiveDescription: string;
  eventSummary: string;
  highlights: string[];
  detailedHighlights: string[];
  outcomes: string[];
  participationDetails: string;
  conclusion: string;
  detailedConclusion: string;
  attendancePercentage: string;
}

/**
 * Extracts a clean topic from the event title by removing prefixes like "Workshop on", etc.
 */
function extractTopic(title: string): string {
  const lowercaseTitle = title.toLowerCase();
  
  // Look for "on " separator which commonly precedes the main topic
  const onIndex = lowercaseTitle.indexOf(' on ');
  if (onIndex !== -1 && onIndex + 4 < title.length) {
    return title.substring(onIndex + 4).trim();
  }
  
  const inIndex = lowercaseTitle.indexOf(' in ');
  if (inIndex !== -1 && inIndex + 4 < title.length) {
    return title.substring(inIndex + 4).trim();
  }

  const regardingIndex = lowercaseTitle.indexOf(' regarding ');
  if (regardingIndex !== -1 && regardingIndex + 11 < title.length) {
    return title.substring(regardingIndex + 11).trim();
  }

  // Fallback to strip prefixes directly
  const cleanTitle = title.replace(/^(?:national|international|state|regional|college|department|district)?\s*(?:level)?\s*(?:workshop|seminar|webinar|symposium|conference|guest\s+lecture|invited\s+talk|fdp|faculty\s+development\s+programme|hackathon|training|orientation|awareness\s+programme|competition|fest|summit|expo)\s*(?:on|in|for)?/i, '').trim();

  return cleanTitle || title;
}

/**
 * Generates context-aware, dynamic event report content based on parsed poster details.
 */
export function generateEventReport(data: ParsedPosterData): GeneratedReport {
  const title = data.title || '';
  const topic = title ? extractTopic(title) : '';
  const eventType = data.eventType || '';
  const speakerName = data.speaker || '';
  const designation = data.designation || '';
  const venue = data.venue || '';
  const department = data.department || '';
  const date = data.date || '';
  const time = data.time || '';

  // If no title is available, return an empty report schema as we have insufficient details
  if (!title) {
    return {
      title: '',
      department: department,
      date: date,
      time: time,
      venue: venue,
      objective: '',
      objectiveDescription: '',
      eventSummary: '',
      highlights: [],
      detailedHighlights: [],
      outcomes: [],
      participationDetails: '',
      conclusion: '',
      detailedConclusion: '',
      attendancePercentage: ''
    };
  }

  const typeLower = eventType.toLowerCase();
  const speakerClause = speakerName ? ` led by ${speakerName}${designation ? ` (${designation})` : ''}` : '';
  const venueClause = venue ? ` at the ${venue}` : '';
  const deptClause = department ? ` organized by the Department of ${department}` : '';

  // 1. Objectives Generation
  let objective = '';
  let objectiveDescription = '';

  if (topic) {
    if (typeLower === 'workshop') {
      objective = `The objective of this workshop was to provide participants with practical exposure to ${topic} and enhance their technical skills through interactive learning sessions.`;
      objectiveDescription = `The workshop focused on bridging the gap between theoretical models and practical engineering implementations of ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` Under the guidance of ${speakerName}${designation ? ` (${designation})` : ''}, attendees explored development methodologies.`;
      }
      if (venue) {
        objectiveDescription += ` The sessions were conducted${venueClause}.`;
      }
    } else if (typeLower === 'seminar') {
      objective = `The seminar aimed to create awareness and deepen understanding of ${topic} among students and faculty members.`;
      objectiveDescription = `This academic seminar focused on the emerging methodologies, research trends, and educational dimensions of ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` Led by ${speakerName}${designation ? ` (${designation})` : ''}, the event stimulated academic inquiry.`;
      }
    } else if (typeLower === 'guest lecture') {
      objective = `The guest lecture was organized to expose students to current industry and academic developments related to ${topic}.`;
      objectiveDescription = `The program aimed to supplement the standard academic curriculum with direct, real-world corporate perspectives on ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` The speaker, ${speakerName}${designation ? ` (${designation})` : ''}, discussed technical workflows and professional standards.`;
      }
    } else if (typeLower === 'webinar') {
      objective = `The webinar was organized to facilitate remote knowledge sharing and digital training on ${topic} with leading industry experts.`;
      objectiveDescription = `Leveraging digital platforms, this webinar aimed to reach a broad cohort of learners interested in ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` Under the expertise of ${speakerName}${designation ? ` (${designation})` : ''}, the session combined presentations with query resolution.`;
      }
    } else if (typeLower === 'faculty development programme' || typeLower === 'fdp') {
      objective = `The Faculty Development Programme was organized to upgrade the pedagogical strategies and research skills of educators teaching ${topic}.`;
      objectiveDescription = `This intensive training program was designed to familiarize academic faculty with recent research paradigms and lab teaching approaches in ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` Led by ${speakerName}${designation ? ` (${designation})` : ''}, it helped coordinators plan syllabus enhancements.`;
      }
    } else if (typeLower === 'hackathon') {
      objective = `The hackathon was organized to challenge participants to solve real-world problems and build prototypes using ${topic} principles under tight time constraints.`;
      objectiveDescription = `This coding challenge pushed student developers to collaborate in sprints, applying ${topic} architectures to solve specified problem statements.`;
      if (speakerName) {
        objectiveDescription += ` The projects and live presentations were evaluated by ${speakerName}${designation ? ` (${designation})` : ''}.`;
      }
    } else if (typeLower === 'symposium' || typeLower === 'conference') {
      objective = `The event was organized to provide a platform for presenting original research, discussing innovations, and exchanging ideas on ${topic}.`;
      objectiveDescription = `The conference served as a convergence point for scholars, researchers, and engineers to discuss advances in ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` With expert tracks chaired by ${speakerName}${designation ? ` (${designation})` : ''}, the session facilitated collaborative dialogue.`;
      }
    } else if (typeLower === 'placement activity') {
      objective = `The placement and career guidance session was conducted to prepare students for job opportunities and career growth in fields related to ${topic}.`;
      objectiveDescription = `This event provided students with vital advice on industry recruitment criteria, technical interview expectations, and essential skill profiles required for jobs in ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` The speaker, ${speakerName}${designation ? ` (${designation})` : ''}, offered customized advice for campus placements.`;
      }
    } else if (typeLower === 'sports event') {
      objective = `The sports competition was organized to promote physical fitness, teamwork, and healthy athletic competitiveness.`;
      objectiveDescription = `This tournament aimed to foster sportsmanship, leadership, and mutual coordination.`;
      if (venue) {
        objectiveDescription += ` The matches, played${venueClause}, featured enthusiastic participation.`;
      }
    } else if (typeLower === 'cultural event') {
      objective = `The cultural celebration was organized to display students' creative talents, celebrate diversity, and build community spirit.`;
      objectiveDescription = `Featuring a variety of stage performances, art exhibitions, and competitive events, this celebration gave students a platform to showcase their artistic talents.`;
    } else {
      objective = `The event was organized to discuss ${topic} and facilitate collaboration in this domain.`;
      objectiveDescription = `The primary objective of the program was to create an interactive forum where participants could engage with key concepts in ${topic}.`;
      if (speakerName) {
        objectiveDescription += ` The expert session was delivered by ${speakerName}${designation ? ` (${designation})` : ''}.`;
      }
    }
  }

  // 2. Program Highlights Generation
  const highlights: string[] = [];
  const detailedHighlights: string[] = [];

  if (topic) {
    if (department && date) {
      highlights.push(`Organized by the Department of ${department} on ${date}`);
    } else if (department) {
      highlights.push(`Organized by the Department of ${department}`);
    } else if (date) {
      highlights.push(`Conducted on ${date}`);
    }
    
    if (speakerName) {
      highlights.push(`Expert session conducted by ${speakerName}${designation ? ` (${designation})` : ''}`);
    }
    
    if (venue) {
      highlights.push(`Conducted successfully at the ${venue}`);
    }
    
    highlights.push(`Focus on core principles, developments, and applications of ${topic}`);

    // Detailed Highlights
    detailedHighlights.push(`Inaugural address and welcome note highlighting the significance of ${topic} in contemporary academic and professional setups.`);
    if (speakerName) {
      detailedHighlights.push(`Technical presentation and demonstrations led by the guest resource person, ${speakerName}, focusing on real-world implementations.`);
    }
    if (venue) {
      detailedHighlights.push(`Interactive discussion and review session held at the ${venue}, where participants resolved queries and received expert feedback.`);
    }
    detailedHighlights.push(`Concluding feedback round and distribution of certificates to participating students and coordinators.`);
  }

  // 3. Outcomes Generation
  let outcomes: string[] = [];
  if (topic) {
    if (typeLower === 'workshop' || typeLower === 'hackathon') {
      outcomes = [
        `Gained a solid, practical understanding of ${topic} frameworks and tools.`,
        `Acquired hands-on experience in building and debugging configurations in ${topic}.`,
        `Developed problem-solving abilities by tackling actual configuration exercises.`,
        `Built collaborative development habits through peer coding sessions.`
      ];
    } else if (typeLower === 'seminar' || typeLower === 'webinar' || typeLower === 'faculty development programme' || typeLower === 'fdp') {
      outcomes = [
        `Acquired deeper theoretical and research insights into ${topic}.`,
        `Identified recent academic trends, research directions, and literature in ${topic}.`,
        `Engaged in active technical queries and clarified conceptual doubts with the expert.`,
        `Formulated potential research paper ideas and collaborative project blueprints.`
      ];
    } else if (typeLower === 'guest lecture' || typeLower === 'placement activity') {
      outcomes = [
        `Learned about modern corporate standards and project expectations related to ${topic}.`,
        `Identified specific career pathways, professional roles, and key skill requirements.`,
        `Acquired tips and preparation methodologies for facing corporate technical interviews.`,
        `Aligned academic projects and elective selections with industry demands.`
      ];
    } else if (typeLower === 'symposium' || typeLower === 'conference') {
      outcomes = [
        `Presented original technical research findings before a peer evaluation panel.`,
        `Received constructive review comments to refine ongoing research designs.`,
        `Disseminated key findings and advancements in ${topic} to attendees.`,
        `Initiated academic networks and research collaborations across colleges.`
      ];
    } else if (typeLower === 'sports event' || typeLower === 'cultural event') {
      outcomes = [
        `Displayed creative talents and athletic skills in a competitive setup.`,
        `Strengthened team coordination, discipline, and peer-to-peer collaboration.`,
        `Cultivated healthy competition and mutual respect among participating teams.`
      ];
    } else {
      outcomes = [
        `Enhanced general understanding and awareness of ${topic}.`,
        `Identified next learning milestones and resources for self-study.`,
        `Fostered academic connections and collaboration within the department.`
      ];
    }
  }

  // 4. Conclusion Generation
  let conclusion = '';
  let detailedConclusion = '';

  if (topic) {
    conclusion = `The event on ${topic} concluded successfully with participants displaying an improved understanding of the concepts.`;
    
    const typeLabel = eventType ? eventType.toLowerCase() : 'event';
    const deptPart = department ? ` for the Department of ${department}` : '';
    detailedConclusion = `In conclusion, the ${typeLabel} on "${title}" proved to be a highly successful and educational initiative${deptPart}.`;
    if (speakerName) {
      detailedConclusion += ` The expertise shared by ${speakerName} served to motivate the participants and establish a strong foundation for future study and research in ${topic}.`;
    }
  }

  const attendancePercentage = ''; // Leave empty if not explicitly provided in the poster
  const participationDetails = department ? `A group of students and faculty members from the Department of ${department} actively participated in this session.` : '';

  return {
    title,
    department,
    date,
    time,
    venue,
    objective,
    objectiveDescription,
    eventSummary: topic ? `The ${eventType ? eventType.toLowerCase() : 'event'} commenced${time ? ` at ${time}` : ''}${date ? ` on ${date}` : ''}${venue ? ` at the ${venue}` : ''} with a formal welcome address.${speakerName ? ` The key session speaker, ${speakerName}${designation ? ` (${designation})` : ''}, delivered a detailed presentation on ${topic}, explaining its relevance and applications.` : ''} This was followed by a technical dialogue and Q&A session. The event concluded with a vote of thanks.` : '',
    highlights,
    detailedHighlights,
    outcomes,
    participationDetails,
    conclusion,
    detailedConclusion,
    attendancePercentage
  };
}
