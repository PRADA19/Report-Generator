import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStage1Facts, validateStage2Narratives } from '../routes/autofill.js';

/**
 * Auto Fill Step 9 — 15 Representative Poster Test Cases
 */
const posterTestCases = [
  {
    id: 1,
    name: 'Simple Poster',
    input: {
      eventTitle: 'AI Workshop',
      eventType: 'Workshop',
      eventStartDate: '15 August 2026',
      eventStartTime: '10:00 AM',
      venue: 'Seminar Hall 1',
      organizingDepartment: 'Computer Science',
      organizingBody: 'CSE Association',
      collaborators: [],
      resourcePersons: [{ name: 'Dr. John Doe', designation: 'Professor', organization: 'KPRCAS' }],
      participants: null
    },
    expected: {
      eventTitle: 'AI Workshop',
      eventType: 'Workshop',
      eventStartDate: '15 August 2026',
      eventStartTime: '10:00 AM',
      venue: 'Seminar Hall 1',
      organizingDepartment: 'Computer Science',
      organizingBody: 'CSE Association',
      collaboratorsCount: 0,
      resourcePersonsCount: 1,
      speakerName: 'Dr. John Doe',
      participants: null
    }
  },
  {
    id: 2,
    name: 'Colorful Poster',
    input: {
      eventTitle: 'Design & UX Symposium',
      eventType: 'Symposium',
      eventStartDate: '20 September 2026',
      eventStartTime: '09:00 AM',
      venue: 'Main Auditorium',
      organizingDepartment: 'Visual Communication',
      organizingBody: 'Design Club',
      collaborators: ['Adobe Student Chapter'],
      resourcePersons: [{ name: 'Ms. Sarah Connor', designation: 'UX Director', organization: 'Figma Inc' }],
      participants: null
    },
    expected: {
      eventTitle: 'Design & UX Symposium',
      eventType: 'Symposium',
      eventStartDate: '20 September 2026',
      eventStartTime: '09:00 AM',
      venue: 'Main Auditorium',
      organizingDepartment: 'Visual Communication',
      organizingBody: 'Design Club',
      collaboratorsCount: 1,
      resourcePersonsCount: 1,
      speakerName: 'Ms. Sarah Connor',
      participants: null
    }
  },
  {
    id: 3,
    name: 'Text-Heavy Poster',
    input: {
      eventTitle: 'International Conference on Advanced Microservices & Cloud Security Architectures',
      eventType: 'Conference',
      eventStartDate: '10 October 2026',
      eventEndDate: '12 October 2026',
      eventStartTime: '09:30 AM',
      eventEndTime: '04:30 PM',
      venue: 'Conference Center Block B',
      organizingDepartment: 'Information Technology',
      organizingBody: 'IQAC & IT Department',
      collaborators: ['IEEE Computer Society', 'ACM Chapter'],
      resourcePersons: [
        { name: 'Dr. Anand Parthasarathy', designation: 'Principal Architect', organization: 'AWS' },
        { name: 'Prof. R. Kumar', designation: 'Dean Academics', organization: 'KPRCAS' }
      ],
      participants: 140
    },
    expected: {
      eventTitle: 'International Conference on Advanced Microservices & Cloud Security Architectures',
      eventType: 'Conference',
      eventStartDate: '10 October 2026',
      eventEndDate: '12 October 2026',
      eventStartTime: '09:30 AM',
      venue: 'Conference Center Block B',
      organizingDepartment: 'Information Technology',
      organizingBody: 'IQAC & IT Department',
      collaboratorsCount: 2,
      resourcePersonsCount: 2,
      speakerName: 'Dr. Anand Parthasarathy',
      participants: 140
    }
  },
  {
    id: 4,
    name: 'Low-Resolution Poster',
    input: {
      eventTitle: 'Guest Lecture on Cyber Security',
      eventType: 'Guest Lecture',
      eventStartDate: '05 November 2026',
      eventStartTime: '11:00 AM',
      venue: 'Lab 3',
      organizingDepartment: 'Computer Science',
      organizingBody: null,
      collaborators: [],
      resourcePersons: [{ name: 'Mr. Alex Vance', designation: 'Security Analyst', organization: 'CyberX' }],
      participants: null
    },
    expected: {
      eventTitle: 'Guest Lecture on Cyber Security',
      eventType: 'Guest Lecture',
      eventStartDate: '05 November 2026',
      eventStartTime: '11:00 AM',
      venue: 'Lab 3',
      organizingDepartment: 'Computer Science',
      organizingBody: null,
      collaboratorsCount: 0,
      resourcePersonsCount: 1,
      speakerName: 'Mr. Alex Vance',
      participants: null
    }
  },
  {
    id: 5,
    name: 'Multi-Column Poster',
    input: {
      eventTitle: 'Data Science & Machine Learning Summit',
      eventType: 'Summit',
      eventStartDate: '18 December 2026',
      eventStartTime: '10:00 AM',
      venue: 'Auditorium Hall A',
      organizingDepartment: 'Data Science',
      organizingBody: 'DS Association',
      collaborators: ['Analytics India'],
      resourcePersons: [
        { name: 'Dr. Priya Sharma', designation: 'AI Scientist', organization: 'Google Research' },
        { name: 'Mr. David Miller', designation: 'Data Engineer', organization: 'Microsoft' }
      ],
      participants: null
    },
    expected: {
      eventTitle: 'Data Science & Machine Learning Summit',
      eventType: 'Summit',
      eventStartDate: '18 December 2026',
      eventStartTime: '10:00 AM',
      venue: 'Auditorium Hall A',
      organizingDepartment: 'Data Science',
      organizingBody: 'DS Association',
      collaboratorsCount: 1,
      resourcePersonsCount: 2,
      speakerName: 'Dr. Priya Sharma',
      participants: null
    }
  },
  {
    id: 6,
    name: 'Poster with Multiple Speakers',
    input: {
      eventTitle: 'Full Stack Web Development FDP',
      eventType: 'Faculty Development Programme',
      eventStartDate: '02 January 2027',
      eventEndDate: '06 January 2027',
      eventStartTime: '09:30 AM',
      venue: 'IT Lab 2',
      organizingDepartment: 'Information Technology',
      organizingBody: 'IQAC Cell',
      collaborators: [],
      resourcePersons: [
        { name: 'Dr. Anand (AWS Certified)', designation: 'Lead Architect', organization: 'AWS' },
        { name: 'Prof. R. Kumar', designation: 'HOD CSE', organization: 'KPRCAS' },
        { name: 'Ms. Nina Patel', designation: 'Senior Frontend Lead', organization: 'Vercel' }
      ],
      participants: 50
    },
    expected: {
      eventTitle: 'Full Stack Web Development FDP',
      eventType: 'Faculty Development Programme',
      eventStartDate: '02 January 2027',
      eventEndDate: '06 January 2027',
      eventStartTime: '09:30 AM',
      venue: 'IT Lab 2',
      organizingDepartment: 'Information Technology',
      organizingBody: 'IQAC Cell',
      collaboratorsCount: 0,
      resourcePersonsCount: 3,
      speakerName: 'Dr. Anand (AWS Certified)',
      participants: 50
    }
  },
  {
    id: 7,
    name: 'Poster with Registration Deadline + Event Date',
    input: {
      eventTitle: 'National Level Coding Hackathon',
      eventType: 'Hackathon',
      eventStartDate: '25 August 2026',
      eventEndDate: '26 August 2026',
      registrationDeadline: '20 August 2026',
      eventStartTime: '10:00 AM',
      venue: 'Software Lab 1',
      organizingDepartment: 'Computer Science',
      organizingBody: 'Coding Club',
      collaborators: ['CSI Chapter'],
      resourcePersons: [{ name: 'Dr. Suresh Kumar', designation: 'Professor', organization: 'KPRCAS' }],
      participants: null
    },
    expected: {
      eventTitle: 'National Level Coding Hackathon',
      eventType: 'Hackathon',
      eventStartDate: '25 August 2026',
      registrationDeadline: '20 August 2026',
      eventStartTime: '10:00 AM',
      venue: 'Software Lab 1',
      organizingDepartment: 'Computer Science',
      organizingBody: 'Coding Club',
      collaboratorsCount: 1,
      resourcePersonsCount: 1,
      speakerName: 'Dr. Suresh Kumar',
      participants: null
    }
  },
  {
    id: 8,
    name: 'Poster with Registration Time + Event Time',
    input: {
      eventTitle: 'Cloud Computing Seminar',
      eventType: 'Seminar',
      eventStartDate: '12 September 2026',
      registrationStartTime: '09:15 AM',
      eventStartTime: '10:00 AM',
      eventEndTime: '01:00 PM',
      venue: 'Seminar Hall II',
      organizingDepartment: 'Computer Science',
      organizingBody: 'CS Forum',
      collaborators: [],
      resourcePersons: [{ name: 'Mr. Robert Ford', designation: 'Cloud Solutions Lead', organization: 'Oracle' }],
      participants: null
    },
    expected: {
      eventTitle: 'Cloud Computing Seminar',
      eventType: 'Seminar',
      eventStartDate: '12 September 2026',
      registrationStartTime: '09:15 AM',
      eventStartTime: '10:00 AM',
      venue: 'Seminar Hall II',
      organizingDepartment: 'Computer Science',
      organizingBody: 'CS Forum',
      collaboratorsCount: 0,
      resourcePersonsCount: 1,
      speakerName: 'Mr. Robert Ford',
      participants: null
    }
  },
  {
    id: 9,
    name: 'Poster Without Venue',
    input: {
      eventTitle: 'Online Webinar on Quantum Computing',
      eventType: 'Webinar',
      eventStartDate: '14 October 2026',
      eventStartTime: '03:00 PM',
      venue: null,
      organizingDepartment: 'Physics & Computer Science',
      organizingBody: 'Science Forum',
      collaborators: ['IAPT'],
      resourcePersons: [{ name: 'Dr. Alan Turing Jr.', designation: 'Quantum Researcher', organization: 'IBM Quantum' }],
      participants: null
    },
    expected: {
      eventTitle: 'Online Webinar on Quantum Computing',
      eventType: 'Webinar',
      eventStartDate: '14 October 2026',
      eventStartTime: '03:00 PM',
      venue: null,
      organizingDepartment: 'Physics & Computer Science',
      organizingBody: 'Science Forum',
      collaboratorsCount: 1,
      resourcePersonsCount: 1,
      speakerName: 'Dr. Alan Turing Jr.',
      participants: null
    }
  },
  {
    id: 10,
    name: 'Poster Without Participant Count',
    input: {
      eventTitle: 'Workshop on Robotics & IoT',
      eventType: 'Workshop',
      eventStartDate: '22 November 2026',
      eventStartTime: '09:30 AM',
      venue: 'Mechatronics Lab',
      organizingDepartment: 'Electronics & Communication',
      organizingBody: 'Robotics Club',
      collaborators: ['IEEE Robotics Society'],
      resourcePersons: [{ name: 'Prof. K. Swaminathan', designation: 'HOD ECE', organization: 'KPRCAS' }],
      participants: null
    },
    expected: {
      eventTitle: 'Workshop on Robotics & IoT',
      eventType: 'Workshop',
      eventStartDate: '22 November 2026',
      eventStartTime: '09:30 AM',
      venue: 'Mechatronics Lab',
      organizingDepartment: 'Electronics & Communication',
      organizingBody: 'Robotics Club',
      collaboratorsCount: 1,
      resourcePersonsCount: 1,
      speakerName: 'Prof. K. Swaminathan',
      participants: null
    }
  },
  {
    id: 11,
    name: 'Poster With Collaboration',
    input: {
      eventTitle: 'Cyber Security Awareness Drive',
      eventType: 'Awareness Programme',
      eventStartDate: '01 December 2026',
      eventStartTime: '10:00 AM',
      venue: 'College Auditorium',
      organizingDepartment: 'Computer Science',
      organizingBody: 'IQAC Cell',
      collaborators: ['Coimbatore City Cyber Crime Wing', 'CSI Chapter'],
      resourcePersons: [{ name: 'Mr. M. Vijay', designation: 'Inspector of Police', organization: 'Cyber Crime Cell' }],
      participants: 250
    },
    expected: {
      eventTitle: 'Cyber Security Awareness Drive',
      eventType: 'Awareness Programme',
      eventStartDate: '01 December 2026',
      eventStartTime: '10:00 AM',
      venue: 'College Auditorium',
      organizingDepartment: 'Computer Science',
      organizingBody: 'IQAC Cell',
      collaboratorsCount: 2,
      resourcePersonsCount: 1,
      speakerName: 'Mr. M. Vijay',
      participants: 250
    }
  },
  {
    id: 12,
    name: 'Poster Without Collaboration',
    input: {
      eventTitle: 'Department Seminar on Software Testing',
      eventType: 'Seminar',
      eventStartDate: '15 December 2026',
      eventStartTime: '02:00 PM',
      venue: 'Seminar Hall 3',
      organizingDepartment: 'Computer Applications',
      organizingBody: 'BCA Association',
      collaborators: [],
      resourcePersons: [{ name: 'Mrs. S. Latha', designation: 'QA Lead', organization: 'TCS' }],
      participants: null
    },
    expected: {
      eventTitle: 'Department Seminar on Software Testing',
      eventType: 'Seminar',
      eventStartDate: '15 December 2026',
      eventStartTime: '02:00 PM',
      venue: 'Seminar Hall 3',
      organizingDepartment: 'Computer Applications',
      organizingBody: 'BCA Association',
      collaboratorsCount: 0,
      resourcePersonsCount: 1,
      speakerName: 'Mrs. S. Latha',
      participants: null
    }
  },
  {
    id: 13,
    name: 'Poster Containing Logos / Decorative Text',
    input: {
      eventTitle: 'National Level Technical Symposium - TECHFEST 2027',
      eventType: 'Symposium',
      eventStartDate: '10 January 2027',
      eventStartTime: '09:00 AM',
      venue: 'Campus Open Ground & Auditorium',
      organizingDepartment: 'Computer Science & Engineering',
      organizingBody: 'Student Council & IQAC',
      collaborators: ['ISTE Student Chapter', 'IEI'],
      resourcePersons: [{ name: 'Dr. G. Ramakrishnan', designation: 'Principal Scientist', organization: 'ISRO' }],
      participants: 500
    },
    expected: {
      eventTitle: 'National Level Technical Symposium - TECHFEST 2027',
      eventType: 'Symposium',
      eventStartDate: '10 January 2027',
      eventStartTime: '09:00 AM',
      venue: 'Campus Open Ground & Auditorium',
      organizingDepartment: 'Computer Science & Engineering',
      organizingBody: 'Student Council & IQAC',
      collaboratorsCount: 2,
      resourcePersonsCount: 1,
      speakerName: 'Dr. G. Ramakrishnan',
      participants: 500
    }
  },
  {
    id: 14,
    name: 'Poster With Long Event Title',
    input: {
      eventTitle: 'Hands-on National Faculty Development Program on Generative AI, Large Language Models, and Agentic Workflow Automation in Modern Higher Education Systems',
      eventType: 'Faculty Development Programme',
      eventStartDate: '20 February 2027',
      eventEndDate: '24 February 2027',
      eventStartTime: '09:30 AM',
      venue: 'AI Research Excellence Center',
      organizingDepartment: 'Artificial Intelligence & Data Science',
      organizingBody: 'IQAC & Research Cell',
      collaborators: ['NASSCOM FutureSkills Prime'],
      resourcePersons: [
        { name: 'Dr. Anand Parthasarathy', designation: 'AI Architect', organization: 'Google Cloud' },
        { name: 'Prof. S. Meenakshi', designation: 'Dean AI', organization: 'KPRCAS' }
      ],
      participants: 80
    },
    expected: {
      eventTitle: 'Hands-on National Faculty Development Program on Generative AI, Large Language Models, and Agentic Workflow Automation in Modern Higher Education Systems',
      eventType: 'Faculty Development Programme',
      eventStartDate: '20 February 2027',
      eventEndDate: '24 February 2027',
      eventStartTime: '09:30 AM',
      venue: 'AI Research Excellence Center',
      organizingDepartment: 'Artificial Intelligence & Data Science',
      organizingBody: 'IQAC & Research Cell',
      collaboratorsCount: 1,
      resourcePersonsCount: 2,
      speakerName: 'Dr. Anand Parthasarathy',
      participants: 80
    }
  },
  {
    id: 15,
    name: 'Poster With Multiple Dates',
    input: {
      eventTitle: 'Annual International Conference on Sustainable Computing',
      eventType: 'Conference',
      eventStartDate: '15 March 2027',
      eventEndDate: '17 March 2027',
      registrationDeadline: '01 March 2027',
      eventStartTime: '09:00 AM',
      venue: 'International Convention Hall',
      organizingDepartment: 'Computer Science',
      organizingBody: 'Research Board & IQAC',
      collaborators: ['Springer', 'IEEE CS'],
      resourcePersons: [
        { name: 'Prof. Hans Weber', designation: 'Professor', organization: 'TU Munich' },
        { name: 'Dr. Lakshmi Narayanan', designation: 'Chief Scientist', organization: 'CSIR' }
      ],
      participants: 300
    },
    expected: {
      eventTitle: 'Annual International Conference on Sustainable Computing',
      eventType: 'Conference',
      eventStartDate: '15 March 2027',
      eventEndDate: '17 March 2027',
      registrationDeadline: '01 March 2027',
      eventStartTime: '09:00 AM',
      venue: 'International Convention Hall',
      organizingDepartment: 'Computer Science',
      organizingBody: 'Research Board & IQAC',
      collaboratorsCount: 2,
      resourcePersonsCount: 2,
      speakerName: 'Prof. Hans Weber',
      participants: 300
    }
  }
];

// 1. Run Field-by-Field Validation for all 15 Representative Poster Test Cases
posterTestCases.forEach((tc) => {
  test(`Auto Fill Suite Case ${tc.id}: ${tc.name}`, () => {
    const validated = validateStage1Facts(tc.input);

    assert.equal(validated.eventTitle, tc.expected.eventTitle, `Case ${tc.id} eventTitle mismatch`);
    assert.equal(validated.eventType, tc.expected.eventType, `Case ${tc.id} eventType mismatch`);
    assert.equal(validated.eventStartDate, tc.expected.eventStartDate, `Case ${tc.id} eventStartDate mismatch`);
    if (tc.expected.eventEndDate) {
      assert.equal(validated.eventEndDate, tc.expected.eventEndDate, `Case ${tc.id} eventEndDate mismatch`);
    }
    if (tc.expected.registrationDeadline) {
      assert.equal(validated.registrationDeadline, tc.expected.registrationDeadline, `Case ${tc.id} registrationDeadline mismatch`);
    }
    assert.equal(validated.eventStartTime, tc.expected.eventStartTime, `Case ${tc.id} eventStartTime mismatch`);
    assert.equal(validated.venue, tc.expected.venue, `Case ${tc.id} venue mismatch`);
    assert.equal(validated.organizingDepartment, tc.expected.organizingDepartment, `Case ${tc.id} organizingDepartment mismatch`);
    assert.equal(validated.organizingBody, tc.expected.organizingBody, `Case ${tc.id} organizingBody mismatch`);
    assert.equal(validated.collaborators.length, tc.expected.collaboratorsCount, `Case ${tc.id} collaborators length mismatch`);
    assert.equal(validated.resourcePersons.length, tc.expected.resourcePersonsCount, `Case ${tc.id} resourcePersons length mismatch`);
    if (tc.expected.resourcePersonsCount > 0) {
      assert.equal(validated.resourcePersons[0].name, tc.expected.speakerName, `Case ${tc.id} resourcePersons[0].name mismatch`);
    }
    assert.equal(validated.participants, tc.expected.participants, `Case ${tc.id} participants mismatch`);
  });
});

// 2. Test Sequential Poster Data Isolation (Poster A → Poster B)
test('Auto Fill Suite: Sequential Upload Data Isolation (Poster A vs Poster B)', () => {
  const posterAFacts = validateStage1Facts({
    eventTitle: 'Poster A Title',
    organizingDepartment: 'Department A',
    venue: 'Hall A',
    resourcePersons: [{ name: 'Speaker A', designation: 'Role A', organization: 'Org A' }]
  });

  const posterBFacts = validateStage1Facts({
    eventTitle: 'Poster B Title',
    organizingDepartment: 'Department B',
    venue: null,
    resourcePersons: [{ name: 'Speaker B', designation: 'Role B', organization: 'Org B' }]
  });

  // Verify Poster B facts do NOT contain any fields from Poster A
  assert.equal(posterBFacts.eventTitle, 'Poster B Title');
  assert.equal(posterBFacts.organizingDepartment, 'Department B');
  assert.equal(posterBFacts.venue, null);
  assert.equal(posterBFacts.resourcePersons[0].name, 'Speaker B');

  assert.notEqual(posterBFacts.eventTitle, posterAFacts.eventTitle);
  assert.notEqual(posterBFacts.organizingDepartment, posterAFacts.organizingDepartment);
  assert.notEqual(posterBFacts.resourcePersons[0].name, posterAFacts.resourcePersons[0].name);
});

// 4. Human-Like Visual & Semantic Understanding Regression Test
test('Auto Fill Suite Case 18: Visual Semantic Understanding (Hack to Patent IPR Event)', () => {
  const inputPosterData = {
    eventTitle: 'An IPR event on HACK TO PATENT: TRANSFORMING IDEAS INTO IP',
    eventType: 'IPR Event',
    organizingBody: 'School of Computing Science',
    organizingDepartment: 'Department of Information Technology',
    collaborators: [],
    eventStartDate: '12-8-2026',
    eventStartTime: '11:00 a.m.',
    venue: 'Lecture Hall',
    participants: null,
    resourcePersons: [
      {
        name: 'Mr. N. Mathimurugan',
        qualification: 'M.E., (Ph.D.)',
        designation: 'Co-founder & CEO',
        organization: 'SM AI Mojo Tech, Coimbatore'
      }
    ]
  };

  const validated = validateStage1Facts(inputPosterData);

  assert.equal(validated.eventTitle, 'HACK TO PATENT: TRANSFORMING IDEAS INTO IP');
  assert.equal(validated.eventType, 'IPR Event');
  assert.equal(validated.organizingBody, 'School of Computing Science');
  assert.equal(validated.organizingDepartment, 'Department of Information Technology');
  assert.equal(validated.eventStartDate, '12-8-2026');
  assert.equal(validated.eventStartTime, '11:00 a.m.');
  assert.equal(validated.venue, 'Lecture Hall');
  assert.equal(validated.participants, null);
  assert.equal(validated.collaborators.length, 0);

  assert.equal(validated.resourcePersons.length, 1);
  assert.equal(validated.resourcePersons[0].name, 'Mr. N. Mathimurugan');
  assert.equal(validated.resourcePersons[0].qualification, 'M.E., (Ph.D.)');
  assert.equal(validated.resourcePersons[0].designation, 'Co-founder & CEO');
  assert.equal(validated.resourcePersons[0].organization, 'SM AI Mojo Tech, Coimbatore');
});
