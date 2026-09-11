// frontend/src/features/editor/store/mockData.ts
import type { EventData, StylingConfig, LayoutConfig, LayoutSection } from '../../../types/editor';

export const DEFAULT_MOCK_EVENT: EventData = {
  title: "National Workshop on Cloud Infrastructure and Microservices Architecture",
  startDate: "2026-08-10",
  endDate: "2026-08-12",
  venue: "Seminar Hall II, KPR Building",
  time: "10:00 AM to 04:30 PM",
  department: "Computer Science and Engineering",
  organizingBody: "IQAC, KPRCAS",
  collaboration: "AWS Academic Academy Support Services",
  resourcePersons: [
    {
      name: "Dr. Anand Parthasarathy",
      designation: "Principal Cloud Engineer",
      organization: "Amazon Web Services India"
    },
    {
      name: "Mrs. Renu Sunder",
      designation: "Solutions Architect Manager",
      organization: "Red Hat India"
    }
  ],
  participantCount: {
    facultyCount: 15,
    studentCount: 120,
    externalCount: 5,
    total: 140
  },
  purpose: "To provide hands-on experience in containerizing applications using Docker and deploying microservices on Kubernetes.",
  summaryPoints: [
    "Delivered a detailed session on modern software architectures including monoliths, microservices, and serverless computing.",
    "Provided a physical laboratory lab experience setting up continuous deployment lines using GitHub Actions and AWS EKS.",
    "Facilitated a troubleshooting sandbox panel with participants working through container network namespace isolation scripts."
  ],
  outcomePoints: [
    "Participants successfully containerized local web apps and deployed multi-pod networks to a managed Kubernetes cluster.",
    "Engineered robust deployment pipelines, decreasing release times in laboratory exercises.",
    "Formulated production templates compliant with cloud infrastructure patterns."
  ],
  images: [
    {
      id: "img_1",
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      caption: "Inaugural session and introduction of AWS cloud platforms",
      widthPercent: 100,
      heightPx: 160,
      maintainAspectRatio: true,
      captionPosition: 'below'
    },
    {
      id: "img_2",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
      caption: "Interactive hands-on sandbox setup with active participant teams",
      widthPercent: 100,
      heightPx: 160,
      maintainAspectRatio: true,
      captionPosition: 'below'
    }
  ],
  conclusion: "The workshop concluded successfully, with participants displaying a clear understanding of containerized deployment topologies and microservices configuration. Feedback shows an average satisfaction score of 96.5% for laboratory exercises.",
  attendancePercentage: "98.4%",
  objectiveDescription: "To bridge the gap between academic education and industrial standard workflows by training students and faculty in cloud-native technologies.",
  eventSummary: "The event commenced with an introductory session on cloud infrastructure concepts. In the afternoon, a hands-on session was conducted focusing on microservices architecture and container configuration. The final day concluded with deployment sandbox testing and feedback collection.",
  participationDetails: "A total of 140 students from the Department of Computer Science and Engineering actively participated in the event.",
  header: {
    institutionName: "KPR College of Arts Science and Research",
    department: "Computer Science and Engineering",
    logo: "/kprcas_logo.png",
    details: "(Affiliated to Bharathiar University, Coimbatore)",
    address: "Avinashi Road, Arasur, Coimbatore – 641 407",
    text: "Quality System Document",
    documentTitle: "Quality System Document",
    reportTitle: "Report of the Event"
  },
  footer: {
    pageNumber: true,
    contact: "KPRCAS/IQAC/EVENTREPORT",
    text: "VERSION: 2",
    docCode: "KPRCAS/IQAC/EVENTREPORT",
    version: "VERSION: 2",
    docDate: "21/08/2026"
  },
  signatures: {
    coordinator: false,
    hod: true,
    iqac: false,
    principal: true,
    hodLabel: "HOD",
    deanLabel: "Dean",
    principalLabel: "Principal"
  }
};

export const DEFAULT_STYLING: StylingConfig = {
  fontFamily: 'Inter',
  fontSizeBase: 10,
  fontSizeHeader: 13,
  fontSizeSubHeader: 9,
  fontSizeTitle: 11,
  fontSizeReportTitle: 12,
  fontSizeTable: 10,
  lineHeight: 1.4,
  paragraphSpacing: 8,
  sectionSpacing: 16,
  textColor: '#1e293b',
  primaryColor: '#004B87',
  tableWidthPercent: 100,
  tableLabelWidthPercent: 32,
  tablePaddingPx: 6,
  tableBorderWidthPx: 1,
  tableBorderColor: '#94a3b8',
  logoWidthPx: 120,
  logoHeightPx: 50,
  logoPosition: 'left',
  showLogo: true,
  pageLayout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 15,
      bottom: 15,
      left: 15,
      right: 15
    }
  }
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  showHeader: true,
  showFooter: true,
  showPageBorder: true,
  imageGridColumns: 2,
  sectionOrderLocked: false,
  photoLayoutMode: 'two',
  compactPhotoMode: false
};

export const DEFAULT_SECTIONS: LayoutSection[] = [
  { id: 'header', title: 'Header Information', visible: true, order: 0 },
  { id: 'purpose', title: 'Event Objective & Purpose', visible: true, order: 1 },
  { id: 'resource_persons', title: 'Resource Persons Profile', visible: true, order: 2 },
  { id: 'participants', title: 'Participation Statistics', visible: true, order: 3 },
  { id: 'summary', title: 'Detailed Event Summary', visible: true, order: 4 },
  { id: 'outcomes', title: 'Key Program Outcomes', visible: true, order: 5 },
  { id: 'images', title: 'Geo-tagged Event Photographs', visible: true, order: 6 }
];
