export const TEMPLATES = [
    {
        id: 'meeting',
        name: 'Meeting Notes',
        content: `# 📅 Meeting Notes: {{date}}

---

### 👥 Attendance & Logistics
**Facilitator:** {{user}}
**Attendees:** - [ ] 

### 🎯 Agenda & Goals
1. 
2. 

---

### 📝 Discussion Points
> Use this section to capture key context and nuances of the conversation.

- 

### ✅ Action Items
- [ ] @{{user}} to follow up on ...
- [ ] 

### 💡 Decisions Made
- **Decision 1:** `
    },
    {
        id: 'kickoff',
        name: 'Project Kickoff',
        content: `# 🚀 Project Kickoff: {{date}}

---

### 📝 Executive Summary
*One sentence describing the project's "North Star" goal.*

### 🛠 Stakeholders
| Role | Name | Responsibilities |
| :--- | :--- | :--- |
| **Owner** | {{user}} | Strategy & Approval |
| **Technical** | | Implementation |

### 🗓 Timeline & Milestones
- **[Date]:** Phase 1 - 
- **[Date]:** Phase 2 - 

---

### 📦 Key Deliverables
1. 
2. 

### ⚠️ Known Risks
- 
`
    },
    {
        id: 'standup',
        name: 'Daily Standup',
        content: `# ⚡ Daily Standup: {{date}}

---

### 🕒 Yesterday
- 

### 🚀 Today
- 

### 🛑 Blockers
- [ ] **None** (or list dependencies here)

---

### 💬 Notes/Shoutouts
- 
`
    },
    {
        id: 'documentation',
        name: 'Technical Doc',
        content: `# 📖 Documentation: {{date}}

---

### 🔍 Overview
Summary of the feature, bug fix, or architecture change.

### 🛠 Technical Implementation
\`\`\`typescript
// Insert code snippet here
\`\`\`

### 🧪 Verification Steps
1. 
2. 

---

### 🔗 Resources
- [Link to Ticket]()
- [Link to Asset]()
`
    }
];

export const templateService = {
    getTemplates() {
        return TEMPLATES;
    },

    injectTemplate(templateId: string): string {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template) return '';

        const today = new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Note: {{user}} can be replaced here if you have auth context available
        return template.content
            .replace(/{{date}}/g, today)
            .replace(/{{user}}/g, 'User');
    }
};