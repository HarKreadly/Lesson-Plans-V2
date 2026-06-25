import { curriculum } from './data/curriculum';

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
  "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
  "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
  "Larry", "Brenda", "Justin", "Pamela"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
  "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
  "Mitchell", "Carter", "Roberts"
];

function getRandomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateInitialTeachers() {
  const teachers = [];
  const groups = ["Group 1", "Group 2", "Group 3", "Group 4"];
  const books = ["Spotlight 1", "Spotlight 2", "Spotlight 3"];
  
  let idCounter = 1;

  // Let's create realistic mock documents
  const sampleDocuments = [
    { name: "Vocabulary_Practice.pdf", suffix: "Vocab_Practice" },
    { name: "Grammar_Quiz.docx", suffix: "Grammar_Assessment" },
    { name: "DEAR_Worksheet.pdf", suffix: "DEAR_Guide" },
    { name: "Lesson_Plan_Draft_Final.pdf", suffix: "Lesson_Plan" },
    { name: "Speaking_Roleplay_Activity.docx", suffix: "Speaking_Activity" },
    { name: "Listening_Task_Script.pdf", suffix: "Listening_Task" },
    { name: "Unit_Review_Questions.pdf", suffix: "Review_Sheet" }
  ];

  // List of public secure PDF links to use as mock document links
  const sampleFileLinks = [
    "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    "https://arxiv.org/pdf/quant-ph/0410100.pdf",
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "https://s1.q4cdn.com/805267702/files/doc_downloads/test.pdf"
  ];

  for (const group of groups) {
    for (let i = 0; i < 40; i++) {
      const book = books[idCounter % 3];
      const bookCurriculum = curriculum[book];
      const unitNames = Object.keys(bookCurriculum);
      const unit = unitNames[Math.floor(Math.random() * unitNames.length)];
      const lessons = bookCurriculum[unit];
      const lesson = lessons[Math.floor(Math.random() * lessons.length)];

      const isCompleted = Math.random() < 0.25; // 25% of assignments already done for demo/testing
      let hasUploaded = false;
      let fileLink = null;
      let versions = [];
      let updatedAt = null;

      if (isCompleted) {
        hasUploaded = true;
        updatedAt = Date.now() - Math.floor(Math.random() * 10 * 24 * 3600 * 1000); // within last 10 days
        fileLink = sampleFileLinks[idCounter % sampleFileLinks.length];
        
        // Create 1 to 3 mock versions for this teacher
        const numVersions = Math.floor(Math.random() * 3) + 1;
        const docPattern = sampleDocuments[(idCounter + i) % sampleDocuments.length];
        
        for (let v = 1; v <= numVersions; v++) {
          const versionTime = updatedAt - (numVersions - v) * 12 * 3600 * 1000;
          const cleanBook = book.replace(" ", "_");
          const cleanUnit = unit.split(":")[0].replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
          const cleanLesson = lesson.split(":")[0].replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
          const customFilename = `${cleanBook}_${cleanUnit}_${cleanLesson}_${docPattern.suffix}_v${v}.${docPattern.name.split('.').pop()}`;
          
          versions.push({
            id: `v_${idCounter}_${v}`,
            name: customFilename,
            book: book,
            unit: unit,
            lesson: lesson,
            fileLink: sampleFileLinks[(idCounter + v) % sampleFileLinks.length],
            uploadedAt: versionTime
          });
        }
      }

      teachers.push({
        id: `t_${idCounter++}`,
        name: getRandomName(),
        group: group,
        unit: unit,
        lesson: lesson,
        book: book,
        hasUploaded: hasUploaded,
        fileLink: fileLink,
        versions: versions,
        updatedAt: updatedAt,
      });
    }
  }

  // Sort alphabetically by name
  return teachers.sort((a, b) => a.name.localeCompare(b.name));
}
